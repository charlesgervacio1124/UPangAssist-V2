const express = require("express");
const crypto = require("crypto");
const SupportConversation = require("../models/SupportConversation");
const { requireAuth, requireAdmin } = require("../middleware/requireAuth");

const router = express.Router();
const MAX_HISTORY_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 2000;

function emitConversation(req, conversation, event = "support:conversation_updated") {
  const io = req.app.get("io");
  if (!io) return;
  const payload = {
    id: String(conversation._id),
    owner: String(conversation.owner),
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt
  };
  io.to("admins").emit(event, payload);
  io.to(`user:${conversation.owner}`).emit("support:status", {
    id: payload.id,
    status: payload.status
  });
}

function normalizeHistory(history, owner, name, question) {
  if (!Array.isArray(history) || history.length > MAX_HISTORY_MESSAGES) {
    return { error: `Conversation history must contain at most ${MAX_HISTORY_MESSAGES} messages.` };
  }

  const messages = [];
  const clientMessageIds = new Set();
  for (const entry of history) {
    if (!entry || !["user", "assistant"].includes(entry.sender) || typeof entry.text !== "string") {
      return { error: "Conversation history contains an invalid message." };
    }
    const text = entry.text.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      return { error: "Conversation history messages must be between 1 and 2000 characters." };
    }
    const clientMessageId = typeof entry.id === "string" ? entry.id.trim() : "";
    if (!/^[\w-]{8,100}$/.test(clientMessageId) || clientMessageIds.has(clientMessageId)) {
      return { error: "Conversation history contains an invalid or duplicate message ID." };
    }
    clientMessageIds.add(clientMessageId);
    messages.push({
      sender: entry.sender === "user" ? "student" : "assistant",
      senderId: entry.sender === "user" ? owner._id : null,
      senderName: entry.sender === "user" ? name : "UPangAssist",
      text,
      clientMessageId
    });
  }

  if (!messages.some((message) => message.sender === "student" && message.text === question)) {
    messages.push({
      sender: "student",
      senderId: owner._id,
      senderName: name,
      text: question,
      clientMessageId: `question-${crypto.randomUUID()}`
    });
  }
  return { messages };
}

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const requestId = typeof req.body?.requestId === "string" ? req.body.requestId.trim() : "";
  const historyResult = normalizeHistory(req.body?.history, req.user, req.user.name, question);
  if (!question || question.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Question must be between 1 and 2000 characters." });
  }
  if (!/^[\w-]{8,100}$/.test(requestId)) {
    return res.status(400).json({ error: "A valid request ID is required." });
  }
  if (historyResult.error) return res.status(400).json({ error: historyResult.error });

  try {
    let conversation = await SupportConversation.findOne({ activeOwner: req.user._id });
    let created = false;
    if (!conversation) {
      try {
        conversation = await SupportConversation.create({
          owner: req.user._id,
          ownerName: req.user.name,
          ownerEmail: req.user.email,
          question,
          status: "waiting_for_support",
          activeOwner: req.user._id,
          requestIds: [requestId],
          messages: historyResult.messages,
          lastMessageAt: new Date()
        });
        created = true;
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await SupportConversation.findOne({ activeOwner: req.user._id });
        if (!conversation) throw error;
      }
    }
    if (!conversation) throw new Error("Support conversation could not be created.");

    if (!created) {
      const claimed = await SupportConversation.findOneAndUpdate(
        {
          _id: conversation._id,
          activeOwner: req.user._id,
          requestIds: { $ne: requestId }
        },
        {
          $addToSet: { requestIds: requestId },
          $set: { question, lastMessageAt: new Date() }
        },
        { new: true, runValidators: true }
      );
      if (claimed) {
        conversation = claimed;
        for (const message of historyResult.messages) {
          const appended = await SupportConversation.findOneAndUpdate(
            {
              _id: conversation._id,
              owner: req.user._id,
              activeOwner: req.user._id,
              status: { $in: ["waiting_for_support", "assigned", "live_chat"] },
              "messages.clientMessageId": { $ne: message.clientMessageId }
            },
            {
              $push: { messages: message },
              $set: { lastMessageAt: new Date() }
            },
            { new: true, runValidators: true }
          );
          if (appended) conversation = appended;
        }
      }
    }

    conversation = await SupportConversation.findById(conversation._id);
    if (!conversation) throw new Error("Support conversation no longer exists.");
    if (["resolved", "ended_by_student"].includes(conversation.status)) {
      return res.status(409).json({ error: "This conversation was resolved. Submit a new support request." });
    }
    emitConversation(req, conversation, "support:new_conversation");
    const adminCount = req.app.get("io")?.sockets.adapter.rooms.get("admins")?.size || 0;
    return res.status(200).json({
      conversation,
      administratorAvailable: adminCount > 0,
      message: adminCount > 0
        ? "Your inquiry has been submitted. A support administrator will join shortly."
        : "Support is currently unavailable. Your inquiry is saved, and an administrator will respond when available."
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findOne({ owner: req.user._id })
      .sort({ updatedAt: -1 });
    return res.json({ conversation });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/end", async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
        activeOwner: req.user._id,
        status: { $in: ["waiting_for_support", "assigned", "live_chat"] }
      },
      {
        $set: { status: "ended_by_student", lastMessageAt: new Date() },
        $unset: { activeOwner: 1 }
      },
      { new: true, runValidators: true }
    );
    if (!conversation) {
      const existing = await SupportConversation.findOne({ _id: req.params.id, owner: req.user._id });
      if (!existing) return res.status(404).json({ error: "Conversation not found." });
      if (existing.status === "ended_by_student") return res.json({ conversation: existing });
      return res.status(409).json({ error: "This conversation is already resolved." });
    }
    emitConversation(req, conversation);
    return res.json({ conversation });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/messages", async (req, res, next) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const clientMessageId = typeof req.body?.clientMessageId === "string"
    ? req.body.clientMessageId.trim()
    : "";
  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message must be between 1 and 2000 characters." });
  }
  if (!/^[\w-]{8,100}$/.test(clientMessageId)) {
    return res.status(400).json({ error: "A valid message ID is required." });
  }

  try {
    const existing = await SupportConversation.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!existing) return res.status(404).json({ error: "Conversation not found." });
    if (["resolved", "ended_by_student"].includes(existing.status)) {
      return res.status(409).json({ error: "This conversation has ended. Reopen live chat to continue." });
    }
    if (existing.messages.some((message) => message.clientMessageId === clientMessageId)) {
      return res.json({ conversation: existing });
    }

    const conversation = await SupportConversation.findOneAndUpdate(
      {
        _id: existing._id,
        owner: req.user._id,
        status: { $in: ["waiting_for_support", "assigned", "live_chat"] },
        "messages.clientMessageId": { $ne: clientMessageId }
      },
      {
        $push: {
          messages: {
            sender: "student",
            senderId: req.user._id,
            senderName: req.user.name,
            text,
            clientMessageId
          }
        },
        $set: { lastMessageAt: new Date() }
      },
      { new: true, runValidators: true }
    );
    if (!conversation) return res.status(409).json({ error: "This conversation can no longer receive messages." });
    emitConversation(req, conversation);
    return res.json({ conversation });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const conversations = await SupportConversation.find()
      .sort({ lastMessageAt: -1 })
      .limit(200)
      .select("-requestIds");
    return res.json({ conversations });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/accept", async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });
    if (conversation.status === "ended_by_student") {
      return res.status(409).json({ error: "The student ended this conversation." });
    }
    if (conversation.status === "resolved") {
      return res.status(409).json({ error: "This conversation is already resolved." });
    }
    if (conversation.assignedTo && String(conversation.assignedTo) !== String(req.user._id)) {
      return res.status(409).json({ error: "This conversation is assigned to another administrator." });
    }
    if (conversation.status === "assigned" && String(conversation.assignedTo) === String(req.user._id)) {
      emitConversation(req, conversation);
      return res.json({ conversation });
    }
    if (conversation.status !== "waiting_for_support") {
      return res.status(409).json({ error: "This conversation has already been accepted." });
    }
    const accepted = await SupportConversation.findOneAndUpdate(
      { _id: conversation._id, status: "waiting_for_support", assignedTo: null },
      { $set: { status: "assigned", assignedTo: req.user._id } },
      { new: true, runValidators: true }
    );
    if (!accepted) {
      const latest = await SupportConversation.findById(conversation._id);
      if (latest?.status === "ended_by_student") {
        return res.status(409).json({ error: "The student ended this conversation." });
      }
      return res.status(409).json({ error: "Another administrator has accepted this conversation." });
    }
    emitConversation(req, accepted);
    return res.json({ conversation: accepted });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/reply", async (req, res, next) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const clientMessageId = typeof req.body?.clientMessageId === "string"
    ? req.body.clientMessageId.trim()
    : "";
  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Reply must be between 1 and 2000 characters." });
  }
  if (!/^[\w-]{8,100}$/.test(clientMessageId)) {
    return res.status(400).json({ error: "A valid message ID is required." });
  }

  try {
    const current = await SupportConversation.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Conversation not found." });
    if (current.status === "ended_by_student") {
      return res.status(409).json({ error: "The student ended this conversation." });
    }
    if (current.status === "resolved") {
      return res.status(409).json({ error: "Resolve status must be changed before replying." });
    }
    if (current.assignedTo && String(current.assignedTo) !== String(req.user._id)) {
      return res.status(409).json({ error: "This conversation is assigned to another administrator." });
    }
    const existingMessage = current.messages.find((message) => message.clientMessageId === clientMessageId);
    if (existingMessage) {
      req.app.get("io")?.to(`user:${current.owner}`).emit("support:message", {
        conversationId: String(current._id),
        message: existingMessage
      });
      return res.json({ conversation: current });
    }

    const message = {
      sender: "admin",
      senderId: req.user._id,
      senderName: req.user.name,
      text,
      clientMessageId
    };
    const conversation = await SupportConversation.findOneAndUpdate(
      {
        _id: current._id,
        status: { $in: ["waiting_for_support", "assigned", "live_chat"] },
        $or: [{ assignedTo: null }, { assignedTo: req.user._id }],
        "messages.clientMessageId": { $ne: clientMessageId }
      },
      {
        $set: { status: "live_chat", assignedTo: req.user._id, lastMessageAt: new Date() },
        $push: { messages: message }
      },
      { new: true, runValidators: true }
    );
    if (!conversation) {
      const latest = await SupportConversation.findById(current._id);
      if (!latest) return res.status(404).json({ error: "Conversation not found." });
      if (latest.messages.some((entry) => entry.clientMessageId === clientMessageId)) {
        const existing = latest.messages.find((entry) => entry.clientMessageId === clientMessageId);
        req.app.get("io")?.to(`user:${latest.owner}`).emit("support:message", {
          conversationId: String(latest._id),
          message: existing
        });
        return res.json({ conversation: latest });
      }
      if (latest.status === "resolved") {
        return res.status(409).json({ error: "This conversation is resolved." });
      }
      if (latest.status === "ended_by_student") {
        return res.status(409).json({ error: "The student ended this conversation." });
      }
      return res.status(409).json({ error: "This conversation is assigned to another administrator." });
    }
    emitConversation(req, conversation);
    const deliveredMessage = conversation.messages[conversation.messages.length - 1];
    req.app.get("io")?.to(`user:${conversation.owner}`).emit("support:message", {
      conversationId: String(conversation._id),
      message: deliveredMessage
    });
    return res.json({ conversation });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/resolve", async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });
    if (conversation.status === "ended_by_student") {
      return res.status(409).json({ error: "The student ended this conversation." });
    }
    if (conversation.assignedTo && String(conversation.assignedTo) !== String(req.user._id)) {
      return res.status(409).json({ error: "This conversation is assigned to another administrator." });
    }
    const resolved = await SupportConversation.findOneAndUpdate(
      {
        _id: conversation._id,
        status: { $in: ["waiting_for_support", "assigned", "live_chat"] },
        $or: [{ assignedTo: null }, { assignedTo: req.user._id }]
      },
      {
        $set: { status: "resolved", assignedTo: req.user._id, lastMessageAt: new Date() },
        $unset: { activeOwner: 1 }
      },
      { new: true, runValidators: true }
    );
    if (!resolved) {
      const latest = await SupportConversation.findById(conversation._id);
      if (latest?.status === "resolved") {
        emitConversation(req, latest);
        return res.json({ conversation: latest });
      }
      return res.status(409).json({ error: "This conversation is assigned to another administrator." });
    }
    emitConversation(req, resolved);
    return res.json({ conversation: resolved });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
