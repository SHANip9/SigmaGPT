# SigmaGPT

SigmaGPT is a MERN-style ChatGPT clone with user accounts, private chat threads, Markdown rendering, voice transcription, and OpenAI-powered assistant responses.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, ReactMarkdown, rehype-highlight, react-spinners, uuid |
| Backend | Node.js, Express 5, Mongoose, JWT auth, bcryptjs, multer |
| Database | MongoDB local or Atlas |
| AI | OpenAI Chat Completions API, plus Whisper transcription |
| Deployment | Vercel configs for frontend and backend |

## Project Structure

```text
SigmaGPT/
  Backend/
    middleware/auth.js       JWT authentication middleware
    models/Thread.js         Chat thread and message schema
    models/User.js           User schema with password hashing
    routes/auth.js           Signup, login, and current-user endpoints
    routes/chat.js           Thread CRUD, chat, and transcription endpoints
    utils/openai.js          OpenAI client and SigmaGPT system prompt
    server.js                Express app, CORS, routes, MongoDB connection
    vercel.json              Backend Vercel deployment config
  Frontend/
    src/Auth.jsx             Login/signup screen
    src/App.jsx              App state, auth state, theme state, context provider
    src/Sidebar.jsx          Thread list, new chat, delete thread
    src/ChatWindow.jsx       Chat input, profile menu, settings, voice input
    src/Chat.jsx             Chat transcript and typing animation
    src/config.js            API base URL from Vite env
    vercel.json              Frontend Vercel deployment config
```

## Features

- Email/password signup and login with JWT sessions.
- Per-user chat history stored in MongoDB.
- Private thread list, thread switching, and deletion.
- Markdown assistant replies with code highlighting.
- Word-by-word typing animation for the latest reply.
- Dark/light theme persistence.
- Voice transcription endpoint using OpenAI Whisper.
- OpenAI quota fallback message so the app remains testable when the API key is out of quota.

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | API and database health |
| `POST` | `/api/auth/signup` | No | Create account |
| `POST` | `/api/auth/login` | No | Log in |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `GET` | `/api/thread` | Yes | Get current user's threads |
| `GET` | `/api/thread/:threadId` | Yes | Get one thread's messages |
| `DELETE` | `/api/thread/:threadId` | Yes | Delete one thread |
| `POST` | `/api/chat` | Yes | Send a chat message |
| `POST` | `/api/transcribe` | Yes | Transcribe uploaded audio |

## Environment Variables

Backend `.env`:

```env
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
JWT_SECRET=replace_with_a_long_random_secret
PORT=8080
FRONTEND_URL=http://localhost:5173
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:8080
```

## Local Run

Start the backend:

```bash
cd Backend
npm install
npm start
```

Start the frontend in another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Verification

```bash
cd Frontend
npm run lint
npm run build

cd ../Backend
node --check server.js
node --check routes/chat.js
node --check routes/auth.js
node --check middleware/auth.js
node --check utils/openai.js
```

You can also check the backend directly:

```bash
curl http://localhost:8080/api/health
```

## Deploying To Vercel

Deploy the backend first, then set the frontend API URL to the deployed backend URL.

Backend:

```bash
cd Backend
vercel --prod
```

Frontend:

```bash
cd Frontend
vercel --prod
```

Required backend production env vars: `MONGODB_URI`, `OPENAI_API_KEY`, `JWT_SECRET`, and optionally `FRONTEND_URL`.

Required frontend production env var: `VITE_API_URL`.

## Current Runtime Note

If the OpenAI account has no quota, chat requests return a mock response from `Backend/utils/openai.js`. That confirms the app pipeline is working, but real assistant answers require a valid OpenAI key with available quota.
