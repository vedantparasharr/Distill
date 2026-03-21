# DistillLearn

> Transform PDFs and YouTube videos into an interactive study workspace powered by Google Gemini.

Upload PDF files or add YouTube videos, then instantly generate flashcards, quizzes, summaries, and context-aware AI chat grounded in your own study material.

**Live demo:** [distilllearn.vercel.app](https://distilllearn.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| **Multi-source Ingestion** | Upload PDF files (up to 10 MB) or add YouTube URLs; content is extracted and chunked automatically |
| **AI Flashcards** | Generate Q&A cards with easy / medium / hard difficulty; star and track reviews |
| **AI Quizzes** | Multiple-choice quizzes with per-question explanations and scoring |
| **AI Summary** | Concise structured summary with key concepts, formatted in Markdown |
| **AI Chat** | Ask any question about your document; answers are grounded in relevant chunks |
| **Concept Explainer** | Deep-dive explanation of any concept found in the document |
| **Progress Dashboard** | Aggregated stats on flashcard reviews and quiz attempts |
| **Auth + Verification** | JWT auth via HTTP-only cookies with OTP email verification, register, login, profile, and password change |

---

## Tech Stack

### Backend
- **Node.js** (ES Modules) + **Express.js 5**
- **MongoDB** via **Mongoose 9**
- **Google Gemini** (`gemini-2.5-flash-lite`) via `@google/genai`
- **JWT** authentication with HTTP-only cookies
- **Multer** (memory storage) for file uploads · **pdf-parse** for text extraction
- **Cloudinary** for PDF file storage
- **Brevo HTTP API** for OTP email delivery
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
│   │   ├── multer.js              # PDF upload config (memory storage, 10 MB default)
│   │   └── cloudinary.js          # Cloudinary upload config for PDF files
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
│   │   ├── textChunker.js         # 500-word chunks with 50-word overlap
│   │   ├── ytParser.js            # YouTube transcript extraction
│   │   └── emailService.js        # OTP email sending
│   └── uploads/                   # Static folder mount (not primary PDF storage path)
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
- A [Cloudinary](https://cloudinary.com/) account (for PDF storage)
- A [youtube-transcript.io](https://www.youtube-transcript.io/) API credential (Basic auth token)
- A [Brevo](https://www.brevo.com/) v3 API key and verified sender email

### 1 — Clone

```bash
git clone <repository-url>
cd "DistillLearn"
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
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
YT_TRANSCRIPT=base64_basic_auth_token_for_youtube_transcript_io
BREVO_API_KEY=your_brevo_v3_api_key
EMAIL_FROM=your_verified_sender_email
APP_NAME=DistillLearn
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
| POST | `/verify-email` | — | Verify email using 6-digit OTP |
| POST | `/resend-otp` | — | Resend verification OTP |
| POST | `/logout` | — | Clear auth cookie |
| GET | `/profile` | ✓ | Get current user |
| PUT | `/updateProfile` | ✓ | Update username / email / avatar |
| POST | `/change-password` | ✓ | Change password |

### Documents — `/api/documents`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | ✓ | Upload PDF (`multipart/form-data`) |
| POST | `/youtube` | ✓ | Add YouTube video document (`title`, `url`) |
| GET | `/` | ✓ | List documents filtered by required query `sourceType=pdf|youtube` |
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
| `CLOUDINARY_CLOUD_NAME` | ✓ | Cloudinary cloud name for PDF uploads |
| `CLOUDINARY_API_KEY` | ✓ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✓ | Cloudinary API secret |
| `YT_TRANSCRIPT` | ✓ | Base64 Basic auth token used by youtube-transcript.io |
| `BREVO_API_KEY` | ✓ | Brevo v3 API key used for transactional email |
| `EMAIL_FROM` | ✓ | Verified sender email used for OTP emails |
| `APP_NAME` | — | Sender display name (default `DistillLearn`) |
| `JWT_EXPIRE` | — | Token lifetime (default `7d`) |
| `PORT` | — | Server port (default `8000`) |
| `MAX_FILE_SIZE` | — | Upload limit in bytes (default `10485760`) |

---

## License

Private — not licensed for redistribution.
