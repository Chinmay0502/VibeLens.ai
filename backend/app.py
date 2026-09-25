import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Lock
from uuid import uuid4
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import summarize, generate_title
from core.extractor import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
)
from core.rag_engine import (
    build_rag_chain,
    load_rag_chain,
    ask_question,
)


BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

print(f"Loading environment from: {ENV_FILE}")
print(f"Google API key loaded: {bool(os.getenv('GOOGLE_API_KEY'))}")
print(f"Groq API key loaded: {bool(os.getenv('GROQ_API_KEY'))}")
print(f"Sarvam API key loaded: {bool(os.getenv('SARVAM_API_KEY'))}")


app = FastAPI(title="VibeLens AI Backend")

print("DENO PATH:", shutil.which("deno"))

try:
    print("DENO VERSION:", subprocess.check_output(
        ["/opt/render/.deno/bin/deno", "--version"],
        text=True
    ))
except Exception as e:
    print("DENO CHECK FAILED:", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


active_rag_chain = None

executor = ThreadPoolExecutor(max_workers=2)

jobs = {}
jobs_lock = Lock()


class PipelineRequest(BaseModel):
    source: str
    language: str = "english"


class ChatRequest(BaseModel):
    question: str


def update_job(
    job_id: str,
    stage: str,
    step: int,
    message: str,
    percent: int,
):
    with jobs_lock:
        if job_id not in jobs:
            return

        jobs[job_id].update(
            {
                "status": "processing",
                "stage": stage,
                "step": step,
                "message": message,
                "percent": percent,
            }
        )


def run_pipeline(
    job_id: str,
    source: str,
    language: str,
):
    global active_rag_chain

    try:
        update_job(
            job_id,
            "downloading",
            0,
            "Downloading and preparing your media...",
            5,
        )

        update_job(
            job_id,
            "audio_processing",
            1,
            "Processing and chunking audio...",
            12,
        )

        chunks = process_input(source)

        update_job(
            job_id,
            "transcribing",
            2,
            "Transcribing your audio...",
            25,
        )

        transcript = transcribe_all(
            chunks,
            language,
        )

        update_job(
            job_id,
            "generating_title",
            3,
            "Generating a concise meeting title...",
            45,
        )

        title = generate_title(
            transcript,
        )

        update_job(
            job_id,
            "generating_summary",
            4,
            "Creating the executive summary...",
            55,
        )

        summary = summarize(
            transcript,
        )

        update_job(
            job_id,
            "extracting_actions",
            5,
            "Finding action items, owners, and deadlines...",
            68,
        )

        action_items = extract_action_items(
            transcript,
        )

        update_job(
            job_id,
            "extracting_decisions",
            6,
            "Identifying key decisions and agreements...",
            78,
        )

        key_decisions = extract_key_decisions(
            transcript,
        )

        update_job(
            job_id,
            "extracting_questions",
            7,
            "Finding unresolved questions and follow-ups...",
            86,
        )

        open_questions = extract_questions(
            transcript,
        )

        update_job(
            job_id,
            "building_rag",
            8,
            "Building searchable meeting memory...",
            94,
        )

        active_rag_chain = build_rag_chain(
            transcript, job_id
        )

        result = {
            "title": title,
            "transcript": transcript,
            "summary": summary,
            "action_items": action_items,
            "key_decisions": key_decisions,
            "open_questions": open_questions,
        }

        with jobs_lock:
            jobs[job_id].update(
                {
                    "status": "completed",
                    "stage": "completed",
                    "step": 9,
                    "message": "Analysis completed successfully.",
                    "percent": 100,
                    "result": result,
                    "error": None,
                }
            )

        print(f"✅ Pipeline completed: {job_id}")

    except Exception as e:
        error_message = str(e)

        print(
            f"❌ Pipeline {job_id} failed: "
            f"{type(e).__name__}: {error_message}"
        )

        with jobs_lock:
            if job_id in jobs:
                jobs[job_id].update(
                    {
                        "status": "failed",
                        "stage": "error",
                        "message": error_message,
                        "error": error_message,
                    }
                )


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "VibeLens AI Backend",
    }


@app.post("/api/process")
def process_media(req: PipelineRequest):
    job_id = str(uuid4())

    with jobs_lock:
        jobs[job_id] = {
            "status": "processing",
            "stage": "queued",
            "step": 0,
            "message": "Analysis queued...",
            "percent": 0,
            "result": None,
            "error": None,
        }

    executor.submit(
        run_pipeline,
        job_id,
        req.source,
        req.language,
    )

    return {
        "job_id": job_id,
        "status": "processing",
    }


@app.get("/api/process/status/{job_id}")
def process_status(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)

        if job is None:
            raise HTTPException(
                status_code=404,
                detail="Processing job not found.",
            )

        return dict(job)


@app.post("/api/chat")
def chat_with_audio(req: ChatRequest):
    global active_rag_chain

    if not active_rag_chain:
        try:
            active_rag_chain = load_rag_chain()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No active meeting context found. "
                    "Please process a video/audio first."
                ),
            )

    try:
        answer = ask_question(
            active_rag_chain,
            req.question,
        )

        return {
            "answer": answer,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=7860,
        reload=False,
    )
