# Distill — AI Learning Assistant

> Transform any PDF into an interactive study workspace powered by Google Gemini.

Upload documents and instantly generate flashcards, quizzes, summaries, and engage in context-aware AI chat — all grounded in your own study material.

**Live demo:** [distilllearn.vercel.app](https://distilllearn.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| **Document Upload** | Upload PDF files (up to 10 MB); text is extracted and chunked automatically |
| **AI Flashcards** | Generate Q&A cards with easy / medium / hard difficulty; star and track reviews |
| **AI Quizzes** | Multiple-choice quizzes with per-question explanations and scoring |
| **AI Summary** | Concise structured summary with key concepts, formatted in Markdown |
| **AI Chat** | Ask any question about your document; answers are grounded in relevant chunks |
| **Concept Explainer** | Deep-dive explanation of any concept found in the document |
| **Progress Dashboard** | Aggregated stats on flashcard reviews and quiz attempts |
| **Auth** | JWT-based authentication via HTTP-only cookies; register, login, profile, password change |

---

## Tech Stack

### Backend
- **Node.js** (ES Modules) + **Express.js 5**
- **MongoDB** via **Mongoose 9**
- **Google Gemini** (`gemini-2.5-flash-lite`) via `@google/genai`
- **JWT** authentication with HTTP-only cookies
- **Multer** for file uploads · **pdf-parse** for text extraction
- **bcryptjs** for password hashing · **express-validator** for input validation

### Frontend
- **React 19** + **React Router DOM 7**
- **Vite 7** · **Tailwind CSS 4**
- **Axios** with `withCredentials` · **react-hot-toast**
- **react-markdown** + **remark-gfm** + **react-syntax-highlighter**
- **Lucide React** icons · **Moment.js**

---

## Project Structure

```
├── backend/
│   ├── server.js                  # Express entry point (port 8000)
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── multer.js              # PDF upload config (10 MB, /uploads/documents)
│   ├── controllers/               # Route logic
│   │   ├── authController.js
│   │   ├── aiController.js
│   │   ├── documentController.js
│   │   ├── flashcardController.js
│   │   ├── quizController.js
│   │   └── progressController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT cookie validation
│   │   └── errorHandler.js
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js
│   │   ├── Document.js            # Stores extracted text + chunks
│   │   ├── Flashcard.js
│   │   ├── Quiz.js
│   │   └── ChatHistory.js
│   ├── routes/
│   ├── utils/
│   │   ├── geminiService.js       # All Gemini API calls with structured JSON output
│   │   ├── pdfParser.js           # Text + metadata extraction
│   │   └── textChunker.js         # 500-word chunks with 50-word overlap
│   └── uploads/documents/         # Uploaded PDFs (git-ignored)
│
└── frontend/
    ├── vite.config.js             # Proxies /api → http://localhost:8000
    └── src/
        ├── App.jsx                # Routes
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── Auth/              # LoginPage, RegisterPage
        │   ├── Dashboard/
        │   ├── Documents/         # DocumentListPage, DocumentDetailPage
        │   ├── Flashcards/        # FlashcardListPage, FlashcardPage
        │   ├── Quizzes/           # QuizTakePage, QuizResultPage
        │   └── Profile/
        ├── services/              # Axios wrapper functions per resource
        └── utils/
            ├── apiPaths.js        # Centralised API path constants
            ├── axiosInstance.js   # Axios with withCredentials
            └── formatters.js
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [Google AI Studio](https://ai.google.dev/) API key

### 1 — Clone

```bash
git clone <repository-url>
cd "AI Learning Assistant"
```

### 2 — Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
PORT=8000
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRE=7d
GEMINI_API_KEY=your_google_gemini_api_key
MAX_FILE_SIZE=10485760
```

```bash
npm run dev     # development — nodemon auto-reload
npm start       # production
```

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so no extra config is needed locally.

---

## API Reference

All routes under `/api`. Protected routes require a valid JWT cookie.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login and receive cookie |
| POST | `/logout` | ✓ | Clear auth cookie |
| GET | `/profile` | ✓ | Get current user |
| PUT | `/updateProfile` | ✓ | Update username / email / avatar |
| POST | `/change-password` | ✓ | Change password |

### Documents — `/api/documents`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | ✓ | Upload PDF (`multipart/form-data`) |
| GET | `/` | ✓ | List all user documents |
| GET | `/:id` | ✓ | Get document details |
| DELETE | `/:id` | ✓ | Delete document |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/generate-flashcards` | ✓ | Generate flashcards from a document |
| POST | `/generate-quiz` | ✓ | Generate a quiz from a document |
| POST | `/generate-summary` | ✓ | Summarise a document |
| POST | `/chat` | ✓ | Chat with document context |
| POST | `/explain-concept` | ✓ | Explain a concept from a document |
| GET | `/chat-history/:documentId` | ✓ | Retrieve chat history |

### Flashcards — `/api/flashcards`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | All flashcard sets |
| GET | `/:documentId` | ✓ | Flashcards for a document |
| POST | `/:cardId/review` | ✓ | Mark card as reviewed |
| PUT | `/:cardId/star` | ✓ | Toggle starred |
| DELETE | `/:id` | ✓ | Delete flashcard set |

### Quizzes — `/api/quiz`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:documentId` | ✓ | List quizzes for a document |
| GET | `/quiz/:id` | ✓ | Get a specific quiz |
| POST | `/:id/submit` | ✓ | Submit answers |
| GET | `/:id/results` | ✓ | Get results |
| DELETE | `/:id` | ✓ | Delete quiz |

### Progress — `/api/progress`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | ✓ | Dashboard statistics |

---

## Deployment

The app is split into two services.

### Backend — Render (Web Service)

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Add these environment variables in the Render dashboard (same as `.env` above, without `PORT`). Render injects `PORT` automatically.

> **Cookie note:** The backend uses the `x-forwarded-proto` header to detect HTTPS automatically, so cookies are always sent with `Secure; SameSite=None` on Render without needing `NODE_ENV=production`.

### Frontend — Vercel (Static Site)

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add one environment variable:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

Add a rewrite rule so React Router works on hard refresh:

| Source | Destination |
|---|---|
| `/*` | `/index.html` |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | ✓ | MongoDB connection string |
| `JWT_SECRET` | ✓ | Secret used to sign JWTs |
| `GEMINI_API_KEY` | ✓ | Google Gemini API key |
| `JWT_EXPIRE` | — | Token lifetime (default `7d`) |
| `PORT` | — | Server port (default `8000`) |
| `MAX_FILE_SIZE` | — | Upload limit in bytes (default `10485760`) |

---

## License

Private — not licensed for redistribution.
