# UPang Assist

UPang Assist provides a student-facing campus assistant backed by a Node.js API and a live university support queue.

## Applications

| Application | Directory | Description |
| :--- | :--- | :--- |
| **Student Assistant** | `my-react-app` | Interactive campus assistant for students and faculty |
| **Admin Dashboard** | `next-app` | Authenticated support queue and administration dashboard |
| **Backend API** | `server` | Node.js Express server and MongoDB API |

---

## Quick Start Commands

From the root project directory:

```bash
# Start the Student Assistant
npm run dev:student

# Start the Admin Dashboard
npm run dev:admin

# Start the Backend API
npm run dev:server
```

Build the applications with:

```bash
npm run build:student
npm run build --prefix next-app
```

## Authentication and live support setup

1. Copy `server/.env.example` to `server/.env`.
2. Set `MONGODB_URI` and `AUTH_TOKEN_SECRET`. Production requires an `AUTH_TOKEN_SECRET` of at least 32 bytes; generate a strong value with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) to provision the administrator account on server startup. `ADMIN_NAME` is optional. Administrator accounts cannot be created from the student signup form.
4. To enable Google sign-in, create a Google OAuth **Web application** client in Google Cloud Console. Set its client ID as `GOOGLE_CLIENT_ID` in `server/.env` and the same value as `VITE_GOOGLE_CLIENT_ID` in `my-react-app/.env`. Add the student app's origin (for local development, `http://localhost:5173`) to the OAuth client's authorized JavaScript origins. Google credentials are verified by the API; no client secret is needed.
5. Start MongoDB and the API, then start either or both Vite apps. The development servers proxy `/api` and `/socket.io` to port 3000.

New manual and Google signups create student accounts. Google sign-in accepts any Google-verified email, links an existing non-admin account with the same verified email, and preserves that account's role. Existing university employee accounts can continue signing in; administrator accounts must use their provisioned administrator credentials. Manual accounts use server-side password hashing and signed bearer tokens. A guest can use the chatbot but must sign in to submit a private support inquiry.

When the chatbot lacks a verified knowledge-base match, produces an inconclusive answer, cannot retrieve information, or detects a request for a person, it offers **Connect with Live Chat** and **Continue Chatting**. Support conversations and their chat history are stored in MongoDB. The admin dashboard loads that same queue and uses authenticated Socket.IO updates for new requests, acceptance, replies, and resolution. A request remains queued if no administrator is connected. Students can resume an unresolved conversation after signing back in or reopen support after resolution.

For separate frontend/API origins, configure `VITE_API_BASE_URL` to the API's `/api` URL and `VITE_SOCKET_URL` to the API origin in each frontend environment. Add both frontend origins to the server's `CLIENT_ORIGINS`.
