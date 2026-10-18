require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const supportRoutes = require("./routes/supportRoutes");
const User = require("./models/User");
const { hashPassword, verifyToken, getTokenSecretStatus } = require("./auth");
const { findSemanticReferences } = require("./semanticSearch");

const app = express();
app.use(express.json({ limit: "128kb" }));
const httpServer = http.createServer(app);
const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    }
  }
});
app.set("io", io);

if (!getTokenSecretStatus()) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_TOKEN_SECRET must be configured with at least 32 bytes in production.");
  }
  console.warn("AUTH_TOKEN_SECRET is not set; local sessions will expire when the server restarts.");
}

io.use(async (socket, next) => {
  const claims = verifyToken(socket.handshake.auth?.token);
  if (!claims) return next(new Error("Authentication required"));
  try {
    const user = await User.findById(claims.sub).select("_id accountType");
    if (!user || user.accountType !== claims.role) return next(new Error("Authentication required"));
    socket.data.user = { id: String(user._id), accountType: user.accountType };
    return next();
  } catch (error) {
    return next(error);
  }
});

io.on("connection", (socket) => {
  if (socket.data.user.accountType === "admin") socket.join("admins");
  else socket.join(`user:${socket.data.user.id}`);
});

function getKnowledgeBase() {
  const filePath = path.join(__dirname, "../data/knowledgeBase.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const ignoredSearchWords = new Set([
  "about", "after", "also", "and", "are", "can", "could", "detail", "details",
  "does", "for", "from", "how", "information", "is", "it", "me", "my", "of",
  "please", "policies", "policy", "process", "procedure", "requirement", "requirements",
  "service", "services", "the", "there", "this", "to", "what", "when", "where",
  "which", "who", "with", "would", "you", "your", "campus", "student", "students"
]);

const searchWordAliases = {
  wear: ["dress", "uniform"],
  wearing: ["dress", "uniform"],
  clothes: ["dress", "uniform"],
  clothing: ["dress", "uniform"],
  aid: ["scholarship", "financial"],
  hk: ["hawak", "kamay", "scholarship"],
  transcript: ["records", "registrar"],
  transcripts: ["records", "registrar"]
};

function getSearchWords(value) {
  const words = (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{2,}/g)
    ?.filter((word) => !ignoredSearchWords.has(word)) || [];

  return words.flatMap((word) => [word, ...(searchWordAliases[word] || [])]);
}

function normalizeSearchWord(word) {
  if (word.length > 5 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("s")) return word.slice(0, -1);
  if (word.length > 6 && word.endsWith("ing")) return word.slice(0, -3);
  return word;
}

function hasTopicMatch(words, reference) {
  const questionWords = new Set(getSearchWords(reference.question).map(normalizeSearchWord));
  const categoryWords = new Set(getSearchWords(reference.category).map(normalizeSearchWord));
  return words.some((word) => questionWords.has(word) || categoryWords.has(word));
}

function findRelevantReferences(question) {
  const words = [...new Set(getSearchWords(question).map(normalizeSearchWord))];

  return getKnowledgeBase()
    .map((reference) => {
      const questionWords = new Set(getSearchWords(reference.question).map(normalizeSearchWord));
      const categoryWords = new Set(getSearchWords(reference.category).map(normalizeSearchWord));
      const answerWords = new Set(getSearchWords(reference.answer).map(normalizeSearchWord));
      const officeWords = new Set(getSearchWords(reference.office).map(normalizeSearchWord));
      const sourceWords = new Set(getSearchWords(reference.source).map(normalizeSearchWord));
      const topicMatch = words.some((word) => questionWords.has(word) || categoryWords.has(word));
      const score = words.reduce((total, word) => {
        const wordScore = Math.max(
          questionWords.has(word) ? 8 : 0,
          categoryWords.has(word) ? 6 : 0,
          answerWords.has(word) ? 2 : 0,
          officeWords.has(word) ? 2 : 0,
          sourceWords.has(word) ? 1 : 0
        );
        return total + (wordScore > 0 ? wordScore + 4 : 0);
      }, 0);
      return { reference, score, topicMatch };
    })
    .filter((item) => item.topicMatch && item.score >= 12)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map((item) => item.reference);
}

function findSpecificBuildingReference(question) {
  const lower = question.toLowerCase();
  const campusReference = getKnowledgeBase().find((reference) =>
    (reference.category || "").toLowerCase().includes("campus navigation")
  );

  if (!campusReference) return null;

  const buildingNames = [
    "main building",
    "cea building",
    "cite building",
    "university library",
    "university gymnasium"
  ];
  const requestedBuilding = buildingNames.find((building) => lower.includes(building));

  if (!requestedBuilding) return null;

  const buildingEntry = campusReference.answer
    .split("•")
    .map((entry) => entry.trim())
    .find((entry) => entry.toLowerCase().startsWith(`${requestedBuilding}:`));

  if (!buildingEntry) return null;

  return {
    ...campusReference,
    answer: `• ${buildingEntry}`
  };
}

function findUnverifiedBuildingName(question) {
  const match = question.match(/\b([a-z0-9-]{3,})\s+building\b/i);
  const buildingName = match?.[1]?.toLowerCase();
  if (!buildingName || ["the", "this", "that"].includes(buildingName)) return null;

  const verifiedText = getKnowledgeBase()
    .map((reference) => [reference.category, reference.question, reference.answer].filter(Boolean).join(" "))
    .join(" ")
    .toLowerCase();

  return verifiedText.includes(buildingName) ? null : match[1];
}

function formatReferences(references) {
  if (references.length === 0) {
    return "No matching verified UPang reference was found in the knowledge base.";
  }

  return references.map((reference, index) => [
    `Reference ${index + 1}`,
    `Category: ${reference.category || "Not specified"}`,
    `Question/topic: ${reference.question || "Not specified"}`,
    `Information: ${reference.answer || "Not specified"}`,
    `Source: ${reference.source || "Not specified"}`,
    `Page/section: ${reference.page || "Not specified"}`,
    `Related office: ${reference.office || "Not specified"}`
  ].join("\n")).join("\n\n");
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const ESCALATION_PROMPT = "I’m sorry, but I couldn’t find a reliable answer to your question. Would you like to connect with our support team for further assistance?";
const humanAssistancePattern = /\b(?:human|person|real person|live chat|support agent|talk to (?:someone|a person|support)|speak to (?:someone|a person|support)|contact (?:an? )?(?:admin|administrator|staff|support))\b/i;
const inconclusiveAnswerPattern = /\b(?:no (?:verified )?(?:upang )?(?:reference|information|answer)|not enough (?:verified )?(?:information|detail)|cannot (?:find|provide|verify)|could(?: not|n't) find (?:a )?(?:reliable|verified|matching)|i don'?t have enough|i am not sure|i'?m not sure)\b/i;

function isInconclusiveAnswer(text) {
  return !text || inconclusiveAnswerPattern.test(text);
}

function sendEscalationResponse(res, wantStream) {
  if (wantStream) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-UPang-Escalation", "true");
    return res.end(ESCALATION_PROMPT);
  }
  return res.json({ text: ESCALATION_PROMPT, escalate: true });
}

async function streamAnswerWithOllama(question, referenceContext, res) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:1b";

  const systemInstruction = `You are UPangAssist, a university information assistant for PHINMA University of Pangasinan (UPang).
Answer student questions factually, warmly, and concisely using the verified UPang references below.
Keep answers brief and straight to the point (under 3-4 sentences when possible).
If you lack enough information, clearly say that there is no verified reference for the specific question and recommend contacting the official UPang office.

Verified UPang references:
${referenceContext}`;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: question }
      ],
      options: {
        num_predict: 160,
        temperature: 0.3
      },
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          answer += parsed.message.content;
        }
      } catch {
        // Ollama streams complete JSON objects, but partial lines can arrive between reads.
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.message?.content) {
        answer += parsed.message.content;
      }
    } catch (error) {
      console.warn("Ignoring incomplete final Ollama stream chunk:", error.message);
    }
  }

  if (isInconclusiveAnswer(answer)) return sendEscalationResponse(res, true);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  for (let index = 0; index < answer.length; index += 48) {
    res.write(answer.slice(index, index + 48));
  }
  return res.end();
}

async function generateAnswerWithOllama(question, referenceContext) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:1b";

  const systemInstruction = `You are UPangAssist, a helpful and student-friendly university information assistant for PHINMA University of Pangasinan (UPang).
Answer strictly using the verified UPang references supplied below. Never invent or hallucinate policies, requirements, fees, dates, or contact details.
Keep your answers brief and straight to the point (under 3-4 sentences). Include source where available.

Verified UPang references:
${referenceContext}`;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: question }
      ],
      options: {
        num_predict: 160,
        temperature: 0.3
      },
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.message?.content?.trim();
}

app.post("/api/chat", async (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const wantStream = req.body?.stream === true || req.query?.stream === "true";

  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }
  if (question.length > 2000) {
    return res.status(400).json({ error: "question must be 2000 characters or fewer" });
  }
  if (humanAssistancePattern.test(question)) {
    return sendEscalationResponse(res, wantStream);
  }

  let unverifiedBuilding;
  let specificBuilding;
  try {
    unverifiedBuilding = findUnverifiedBuildingName(question);
    specificBuilding = unverifiedBuilding ? null : findSpecificBuildingReference(question);
  } catch (error) {
    console.error("Knowledge base retrieval failed:", error.message);
    return sendEscalationResponse(res, wantStream);
  }
  if (unverifiedBuilding) {
    return sendEscalationResponse(res, wantStream);
  }

  if (specificBuilding) {
    const specificBuildingText = `${specificBuilding.answer}\n\n*Source: ${specificBuilding.source || "UPang Campus Directory"} (${specificBuilding.page || "Campus Map"})*`;
    if (wantStream) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end(specificBuildingText);
    }
    return res.json({ text: specificBuildingText, provider: "instant_knowledge_base" });
  }

  // Semantic search handles paraphrases; keyword search remains a safe fallback.
  let references = [];
  try {
    references = findRelevantReferences(question);
    const semanticWords = [...new Set(getSearchWords(question).map(normalizeSearchWord))];
    const semanticReferences = (await findSemanticReferences(question, getKnowledgeBase()))
      .filter((reference) => hasTopicMatch(semanticWords, reference));
    if (semanticReferences.length > 0) references = semanticReferences;
  } catch (error) {
    console.warn("Knowledge retrieval unavailable; using keyword search:", error.message);
    if (references.length === 0) return sendEscalationResponse(res, wantStream);
  }
  if (references.length === 0) {
    return sendEscalationResponse(res, wantStream);
  }
  const referenceContext = formatReferences(references);
  const provider = (process.env.LLM_PROVIDER || "ollama").toLowerCase();

  try {
    // 2. Streamed generation with local LLM for real-time word-by-word display
    if (provider === "ollama" && wantStream) {
      return await streamAnswerWithOllama(question, referenceContext, res);
    }

    let text = "";
    if (provider === "ollama") {
      text = await generateAnswerWithOllama(question, referenceContext);
    } else {
      text = references.length > 0
        ? `${references[0].answer}\n\n*Source: ${references[0].source || "UPang Knowledge Base"} (${references[0].office || "Official Office"})*`
        : "I do not have enough verified information to answer this question. Please contact the appropriate UPang office for assistance.";
    }

    if (!text) {
      return sendEscalationResponse(res, wantStream);
    }

    if (isInconclusiveAnswer(text)) return sendEscalationResponse(res, wantStream);
    return res.json({ text, provider, escalate: false });
  } catch (error) {
    console.error(`Chat error (${provider}):`, error.message);

    // Use verified knowledge-base content if the optional local model is unavailable.
    if (references.length > 0) {
      const top = references[0];
      const fallbackText = `${top.answer}\n\n*Office: ${top.office || "Official Office"} | Source: ${top.source || "Official UPang Guidelines"}*`;
      if (isInconclusiveAnswer(fallbackText)) return sendEscalationResponse(res, wantStream);
      if (wantStream) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end(fallbackText);
      }
      return res.json({ text: fallbackText, fallback: true, escalate: false });
    }

    return sendEscalationResponse(res, wantStream);
  }
});

async function provisionConfiguredAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 12) {
    throw new Error("Set both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.");
  }
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.accountType !== "admin") {
      throw new Error("ADMIN_EMAIL is already registered as a non-administrator account.");
    }
    return;
  }
  await User.create({
    name: process.env.ADMIN_NAME?.trim() || "UPang Support Administrator",
    email,
    passwordHash: hashPassword(password),
    accountType: "admin"
  });
  console.log("Configured support administrator provisioned.");
}

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/upang-assist")
  .then(async () => {
    await provisionConfiguredAdmin();
    console.log("MongoDB connected");
  })
  .catch((err) => console.error("MongoDB connection error:", err.message));

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/support", supportRoutes);

app.use((error, _req, res, _next) => {
  console.error("API request failed:", error.message);
  if (res.headersSent) return;
  return res.status(500).json({ error: "The request could not be completed. Please try again." });
});

const port = Number(process.env.PORT || 3000);
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
