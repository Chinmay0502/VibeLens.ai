# 🤖 VibeLens AI — AI Video & Meeting Intelligence Platform

**VibeLens AI** is a full-stack AI-powered video and audio intelligence platform that transforms long-form videos, meetings, lectures, and audio recordings into structured, searchable knowledge.

Users can provide a **YouTube URL** or **upload an audio/video file**, after which VibeLens processes the media through a real-time FastAPI pipeline to generate transcripts, executive summaries, action items, key decisions, unresolved questions, and an AI-powered RAG chatbot.

The project combines a **React + Vite frontend**, **FastAPI backend**, **Groq Whisper**, **Sarvam AI**, **Google Gemini**, **Qdrant vector search**, **yt-dlp**, and cloud deployment through **Vercel and Render**.

---

# 🌟 Overview

Modern meetings, lectures, interviews, webinars, and educational videos contain valuable information, but manually reviewing long recordings is time-consuming.

**VibeLens AI** addresses this problem by converting raw audio/video into structured and searchable intelligence.

The application can:

* 🎥 Process YouTube videos
* 📁 Process uploaded audio/video files
* 🎙️ Transcribe English and Hinglish audio
* 📝 Generate executive summaries
* ✅ Extract action items
* 🎯 Identify key decisions
* ❓ Detect unresolved questions
* 🧠 Build searchable meeting memory
* 💬 Answer questions using RAG
* 📊 Display real-time backend processing progress

---

# ✨ Key Features

## 🎥 Multi-Source Media Processing

VibeLens supports two primary input methods:

* YouTube URL
* Uploaded audio/video file

Supported upload formats:

```text
MP3
WAV
M4A
MP4
MOV
WEBM
```

---

## 🎙️ AI Transcription

The audio processing pipeline prepares media into standardized audio chunks before transcription.

VibeLens supports:

* 🇬🇧 English transcription using Groq Whisper
* 🇮🇳 Hinglish transcription using Sarvam AI

Audio is normalized to:

```text
Mono
16 kHz
WAV
```

and divided into manageable chunks for downstream transcription.

---

## 📝 Executive Summary

After transcription, VibeLens uses an LLM pipeline to generate a concise executive summary containing the most important information from the source.

---

## ✅ Action Items

The system identifies actionable tasks from the transcript, including:

* Tasks
* Owners
* Deadlines
* Follow-up activities

---

## 🎯 Key Decisions

VibeLens extracts important decisions, agreements, and conclusions discussed during the meeting or video.

---

## ❓ Open Questions

The system identifies unresolved questions and follow-ups that may require additional discussion or research.

---

## 💬 RAG-Powered Q&A

VibeLens converts the transcript into searchable vector embeddings and stores them in Qdrant.

Users can then ask questions such as:

```text
What were the main decisions?

Who was assigned the marketing task?

What problems were discussed?

What questions remain unresolved?

What did the speaker say about the project timeline?
```

The chatbot retrieves relevant transcript sections and generates an answer using the meeting context.

---

## 📊 Real-Time Processing Progress

The frontend does not use a fake progress timer.

The React interface polls the FastAPI backend for the actual processing job status.

The pipeline reports stages such as:

```text
Downloading
Audio Processing
Transcription
Title Generation
Summary Generation
Action Extraction
Decision Extraction
Question Extraction
RAG Building
Completed
```

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────────┐
                         │       VibeLens UI        │
                         │     React + Vite         │
                         │        Vercel             │
                         └────────────┬─────────────┘
                                      │
                         YouTube URL / File Upload
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │      FastAPI Backend     │
                         │         Render            │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             ┌────────────┐   ┌──────────────┐  ┌──────────────┐
             │   yt-dlp   │   │ Audio        │  │ Uploaded     │
             │ YouTube    │   │ Processing   │  │ Media        │
             └─────┬──────┘   └──────┬───────┘  └──────┬───────┘
                   │                  │                 │
                   └──────────────────┼─────────────────┘
                                      ▼
                            ┌──────────────────┐
                            │ Audio Normalizer │
                            │ Mono / 16 kHz    │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Audio Chunking   │
                            └────────┬─────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │      Transcription     │
                         │                        │
                         │ Groq Whisper / Sarvam │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │     LLM Intelligence   │
                         │                        │
                         │ Title / Summary        │
                         │ Actions / Decisions    │
                         │ Open Questions         │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │     Qdrant Vector DB   │
                         │   Meeting Memory/RAG   │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │       RAG Chatbot      │
                         │    Contextual Q&A      │
                         └────────────────────────┘
```

---

# 🔄 How It Works

VibeLens processes a source through a nine-stage backend pipeline.

## Step 1 — Source Submission

The user provides either:

```text
YouTube URL
```

or uploads:

```text
MP3 / WAV / M4A / MP4 / MOV / WEBM
```

---

## Step 2 — Media Preparation

For YouTube sources, `yt-dlp` downloads the best available audio.

For uploaded files, the backend reads the temporary uploaded media file.

YouTube extraction uses:

* yt-dlp
* Deno JavaScript runtime
* YouTube EJS challenge support
* bgutil PO-token provider
* Render Secret File cookies

---

## Step 3 — Audio Processing

The media is converted into standardized audio:

```text
Mono
16 kHz
WAV
```

This creates a consistent input format for transcription.

---

## Step 4 — Audio Chunking

Long audio is divided into smaller chunks.

The current implementation uses:

```text
2-minute chunks
```

Each chunk is processed independently during transcription.

---

## Step 5 — Transcription

The selected language determines the transcription engine.

### English

```text
Groq Whisper
```

### Hinglish

```text
Sarvam AI
```

The resulting chunks are combined into the final transcript.

---

## Step 6 — AI Intelligence Generation

The transcript is processed by the LLM pipeline to generate:

```text
Title
Executive Summary
Action Items
Key Decisions
Open Questions
```

---

## Step 7 — Meeting Memory

The transcript is split into smaller text chunks and converted into embeddings.

The embeddings are stored in:

```text
Qdrant
```

Each meeting is associated with its own meeting identifier so that retrieval can be scoped to the relevant transcript.

---

## Step 8 — RAG Retrieval

When the user asks a question, VibeLens retrieves the most relevant transcript chunks from Qdrant.

The retrieved context is passed into the RAG pipeline.

---

## Step 9 — AI Answer

The system generates a contextual answer based on the retrieved transcript information.

This creates an interactive:

```text
Ask Your Meeting
```

experience.

---

# 🛠️ Technology Stack

## Frontend

* **React**
* **Vite**
* **JavaScript**
* **Tailwind CSS**
* **Vercel**

The frontend provides:

* Source input
* File upload
* Language selection
* Processing progress
* Transcript viewer
* Summary viewer
* Action items
* Decisions
* Open questions
* RAG chatbot

---

## Backend

* **Python**
* **FastAPI**
* **Uvicorn**
* **Pydantic**
* **ThreadPoolExecutor**

FastAPI exposes the application API and manages background processing jobs.

---

## Artificial Intelligence

### Large Language Model

* **Groq**
* LangChain Groq integration

Used for AI-generated intelligence such as:

* Titles
* Summaries
* Action items
* Decisions
* Questions
* RAG responses

---

### Speech-to-Text

* **Groq Whisper**
* **Sarvam AI**

---

### Embeddings

* **Google Gemini Embeddings**
* `gemini-embedding-001`

---

### Vector Database

* **Qdrant**

Used for:

* Transcript embeddings
* Semantic search
* Meeting-specific retrieval
* RAG chatbot context

---

## Media Processing

* **yt-dlp**
* **pydub**
* **FFmpeg**

---

## YouTube Processing Infrastructure

VibeLens uses:

```text
yt-dlp
Deno
YouTube EJS support
bgutil-ytdlp-pot-provider
YouTube authentication cookies
```

The external PO-token provider is hosted separately on Render.

---

## Deployment

### Frontend

```text
Vercel
```

### Backend

```text
Render
```

### PO Token Provider

```text
Render
```

### Vector Database

```text
Qdrant Cloud / External Qdrant instance
```

### Source Control

```text
GitHub
```

---

# 📁 Project Structure

```text
AI_Video_Assistant_Project/
│
├── backend/
│   │
│   ├── app.py
│   │
│   ├── core/
│   │   ├── embeddings.py
│   │   ├── extractor.py
│   │   ├── llm.py
│   │   ├── rag_engine.py
│   │   ├── summarizer.py
│   │   ├── transcriber.py
│   │   └── vector_store.py
│   │
│   ├── utils/
│   │   └── audio_processor.py
│   │
│   ├── uploads/
│   │
│   ├── requirements.txt
│   ├── requirements-render.txt
│   ├── .python-version
│   └── .gitignore
│
├── frontend/
│   │
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .gitignore
│
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Python 3.x
* Node.js
* npm
* Git
* GitHub account
* Google Gemini API key
* Groq API key
* Sarvam API key
* Qdrant instance
* YouTube cookies for authenticated YouTube extraction

---

# 📥 Clone the Repository

```bash
git clone https://github.com/Chinmay0502/VibeLens.ai.git
cd VibeLens.ai
```

---

# 🐍 Backend Setup

Move into the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```cmd
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# ⚙️ Backend Environment Variables

Create a local `.env` file inside:

```text
backend/.env
```

Example:

```env
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
SARVAM_API_KEY=your_sarvam_api_key

QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

GROQ_MODEL=openai/gpt-oss-20b
```

Never commit the real `.env` file to GitHub.

---

# ▶️ Running the Backend Locally

From the `backend` directory:

```bash
uvicorn app:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

The health endpoint is:

```text
/api/health
```

Example response:

```json
{
  "status": "ok",
  "service": "VibeLens AI Backend"
}
```

---

# 💻 Frontend Setup

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/.env.local
```

Add:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The Vite development server will provide the local frontend URL shown in the terminal.

---

# 🎥 YouTube Processing

The backend accepts a YouTube URL through:

```text
POST /api/process
```

Example request:

```json
{
  "source": "https://www.youtube.com/watch?v=VIDEO_ID",
  "language": "english"
}
```

The backend creates a processing job and returns:

```json
{
  "job_id": "generated-job-id",
  "status": "processing"
}
```

The frontend then polls:

```text
GET /api/process/status/{job_id}
```

until the job is completed or fails.

---

# 📁 File Upload Processing

VibeLens also supports direct audio/video uploads through:

```text
POST /api/process-upload
```

Supported formats:

```text
MP3
WAV
M4A
MP4
MOV
WEBM
```

Uploaded files are temporarily stored by the backend and deleted after processing.

---

# 🌐 Production Deployment

## Frontend — Vercel

Connect the GitHub repository to Vercel.

Configure the frontend project with the appropriate root directory:

```text
frontend
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Add the production environment variable:

```env
VITE_API_BASE_URL=https://vibelens-backend.onrender.com
```

After deployment, Vercel hosts the VibeLens frontend.

---

# ☁️ Backend — Render

Create a Render Web Service connected to the GitHub repository.

Set the backend root directory to:

```text
backend
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
export PATH="/opt/render/project/src/.deno/bin:$PATH" && uvicorn app:app --host 0.0.0.0 --port $PORT
```

---

# 🔑 Render Environment Variables

Configure the required secrets in Render rather than committing them to GitHub.

```text
GOOGLE_API_KEY
GROQ_API_KEY
SARVAM_API_KEY
QDRANT_URL
QDRANT_API_KEY
GROQ_MODEL
```

---

# 🍪 YouTube Authentication

YouTube extraction uses a Netscape-format cookies file.

The Render Secret File is mounted at:

```text
/etc/secrets/cookies.txt
```

Because Render Secret Files are read-only, VibeLens copies the file to writable temporary storage:

```text
/tmp/vibelens_youtube_cookies.txt
```

yt-dlp then uses the temporary copy.

The cookie file must never be committed to GitHub.

---

# 🧩 PO Token Provider

VibeLens uses the `bgutil-ytdlp-pot-provider` system to support YouTube extraction.

The provider is deployed separately on Render.

Current provider URL:

```text
https://vibelens-pot-provider.onrender.com
```

The backend configures yt-dlp with:

```python
"extractor_args": {
    "youtubepot-bgutilhttp": {
        "base_url": "https://vibelens-pot-provider.onrender.com"
    }
}
```

---

# 🔐 Security

## Never Commit Secrets

Do not commit:

```text
.env
cookies.txt
```

or any API keys or authentication credentials.

---

## Environment Variables

Keep API keys in:

```text
.env
```

during local development and Render environment variables during production deployment.

---

## YouTube Cookies

YouTube cookies should be treated as authentication credentials.

Never:

* Upload them to GitHub
* Paste them into source code
* Share them publicly
* Include them in README files

---

# 🔄 Git Workflow

Check changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Update VibeLens AI"
```

Push:

```bash
git push origin main
```

Render and Vercel can then deploy the updated application from GitHub.

---

# 🧪 API Endpoints

| Endpoint                       | Method | Purpose                                     |
| ------------------------------ | ------ | ------------------------------------------- |
| `/api/health`                  | GET    | Backend health check                        |
| `/api/process`                 | POST   | Start YouTube/backend-source processing     |
| `/api/process-upload`          | POST   | Start uploaded-file processing              |
| `/api/process/status/{job_id}` | GET    | Get processing progress                     |
| `/api/chat`                    | POST   | Ask questions about processed meeting/video |

---

# 📊 Processing Pipeline

```text
1. Source Submitted
        ↓
2. Download / Upload Preparation
        ↓
3. Audio Processing
        ↓
4. Audio Chunking
        ↓
5. Transcription
        ↓
6. Title Generation
        ↓
7. Executive Summary
        ↓
8. Action / Decision / Question Extraction
        ↓
9. Qdrant RAG Memory
        ↓
10. AI Q&A
```

---

# 🎯 Use Cases

## 🧑‍💼 Meetings

Turn meeting recordings into:

* Executive summaries
* Action items
* Owners
* Decisions
* Follow-ups
* Searchable meeting memory

---

## 🎓 Education

Process lectures and educational videos to:

* Generate summaries
* Search transcripts
* Identify important concepts
* Ask questions about the lecture
* Find unresolved topics

---

## 📺 YouTube Research

Paste a YouTube URL to:

* Transcribe the video
* Summarize its content
* Extract important points
* Search the transcript
* Ask questions about the video

---

## 🧠 Knowledge Management

VibeLens transforms unstructured media into a searchable AI knowledge layer.

```text
Raw Media
    ↓
Transcript
    ↓
Structured Intelligence
    ↓
Vector Memory
    ↓
AI Question Answering
```

---

# 🌐 Production Architecture

```text
                    USER
                      │
                      ▼
              ┌───────────────┐
              │    Vercel     │
              │ React + Vite  │
              └───────┬───────┘
                      │ HTTPS
                      ▼
              ┌───────────────┐
              │    Render     │
              │    FastAPI    │
              └───────┬───────┘
                      │
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
      YouTube      AI Models     Qdrant
       yt-dlp      Groq/Sarvam    Vector DB
          │           │
          ▼           ▼
       PO Token    Gemini
       Provider
          │
          ▼
       Render
```

---

# 📌 Important Files

| File / Directory                   | GitHub | Purpose                   |
| ---------------------------------- | -----: | ------------------------- |
| `backend/app.py`                   |      ✅ | FastAPI application       |
| `backend/core/`                    |      ✅ | AI/RAG processing modules |
| `backend/utils/audio_processor.py` |      ✅ | Media/audio processing    |
| `backend/requirements.txt`         |      ✅ | Python dependencies       |
| `frontend/src/`                    |      ✅ | React application         |
| `frontend/package.json`            |      ✅ | Frontend dependencies     |
| `README.md`                        |      ✅ | Project documentation     |
| `.gitignore`                       |      ✅ | Git exclusions            |
| `.env`                             |      ❌ | Local secrets             |
| `cookies.txt`                      |      ❌ | YouTube authentication    |
| `uploads/`                         |      ❌ | Temporary uploaded media  |
| `venv/`                            |      ❌ | Local Python environment  |
| `.venv/`                           |      ❌ | Local Python environment  |
| `node_modules/`                    |      ❌ | Local Node dependencies   |

---

# 🚀 Current Deployment

### Frontend

```text
Platform: Vercel
Application: React + Vite
```

### Backend

```text
Platform: Render
Framework: FastAPI
```

### YouTube PO Token Provider

```text
Platform: Render
Provider: bgutil-ytdlp-pot-provider
```

### Vector Database

```text
Qdrant
```

---

# ⭐ Project Highlights

VibeLens AI demonstrates a complete production-oriented Generative AI workflow:

```text
Multimedia Input
      ↓
Media Processing
      ↓
Speech-to-Text
      ↓
LLM Processing
      ↓
Structured Intelligence
      ↓
Vector Database
      ↓
RAG Retrieval
      ↓
Conversational AI
```

The project combines **Generative AI, speech recognition, vector databases, retrieval-augmented generation, full-stack development, asynchronous backend processing, and cloud deployment** into a single application.

---

# 📜 License

This project is intended for educational, demonstration, and portfolio purposes.

---

# 🤝 Contributing

Contributions, suggestions, feature requests, and bug reports are welcome.

Typical workflow:

```bash
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

Then open a Pull Request on GitHub.

---

# ❤️ VibeLens AI

**Turn Hours of Video Into Instant Intelligence.**

```text
Watch less.
Understand more.
Ask anything.
```
