import os
import requests
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
from pydub import AudioSegment


# ============================================================
# ENVIRONMENT
# ============================================================

# .env is located in the same directory as this Python file.
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)

print(f"Loading environment from: {ENV_FILE}")


# ============================================================
# SARVAM CONFIG
# ============================================================

# Sarvam's sync STT-translate API rejects audio longer than 30s.
# We slice each chunk into 25s pieces before sending.
SARVAM_PIECE_SECONDS = 25

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

SARVAM_STT_TRANSLATE_URL = (
    "https://api.sarvam.ai/speech-to-text-translate"
)

SARVAM_MODEL = os.getenv(
    "SARVAM_STT_MODEL",
    "saaras:v4"
)


# ============================================================
# GROQ CONFIG
# ============================================================
GROQ_PIECE_SECONDS = 25
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_STT_MODEL = os.getenv(
    "GROQ_STT_MODEL",
    "whisper-large-v3-turbo"
)


# ============================================================
# ENVIRONMENT VALIDATION
# ============================================================

print(
    f"Groq API key loaded: {bool(GROQ_API_KEY)}"
)

print(
    f"Sarvam API key loaded: {bool(SARVAM_API_KEY)}"
)

print(
    f"Groq STT model: {GROQ_STT_MODEL}"
)


if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not set in backend/.env"
    )


# Create Groq client
groq_client = Groq(
    api_key=GROQ_API_KEY
)


# ============================================================
# GROQ WHISPER
# ============================================================

def transcribe_chunk_whisper(chunk_path: str) -> str:
    """
    Send audio to Groq Whisper in small pieces.

    Groq has a direct upload size limit, so large WAV files
    are split into 25-second pieces before uploading.
    """

    print(f"  → Preparing {chunk_path} for Groq...")

    audio = AudioSegment.from_wav(chunk_path)

    piece_ms = GROQ_PIECE_SECONDS * 1000

    total_pieces = (
        len(audio) + piece_ms - 1
    ) // piece_ms

    full_text = ""

    print(
        f"  → Groq will process "
        f"{total_pieces} piece(s)"
    )

    for i, start in enumerate(
        range(0, len(audio), piece_ms)
    ):

        piece = audio[
            start:start + piece_ms
        ]

        piece_path = (
            f"{chunk_path}_groq_{i}.wav"
        )

        piece.export(
            piece_path,
            format="wav"
        )

        try:

            piece_size_mb = (
                os.path.getsize(piece_path)
                / (1024 * 1024)
            )

            print(
                f"  → Groq piece "
                f"{i + 1}/{total_pieces} "
                f"({piece_size_mb:.2f} MB)"
            )

            with open(
                piece_path,
                "rb"
            ) as audio_file:

                transcription = (
                    groq_client
                    .audio
                    .transcriptions
                    .create(
                        file=audio_file,
                        model=GROQ_STT_MODEL,
                        language="en",
                        response_format="json",
                        temperature=0.0,
                    )
                )

            full_text += (
                transcription.text + " "
            )

        except Exception as e:

            print(
                f"\n❌ Groq failed on "
                f"piece {i + 1}/{total_pieces}"
            )

            print(
                f"Exception type: "
                f"{type(e).__name__}"
            )

            print(
                f"Exception: {e}"
            )

            raise

        finally:

            if os.path.exists(piece_path):
                os.remove(piece_path)

    return full_text.strip()

# ============================================================
# SARVAM
# ============================================================

def _send_to_sarvam(
    piece_path: str
) -> str:
    """
    Send one ≤30s WAV file to Sarvam
    and return the English transcript.
    """

    headers = {
        "api-subscription-key": SARVAM_API_KEY
    }

    with open(piece_path, "rb") as f:

        files = {
            "file": (
                os.path.basename(piece_path),
                f,
                "audio/wav"
            )
        }

        data = {
            "model": SARVAM_MODEL,
            "with_diarization": "false"
        }

        response = requests.post(
            SARVAM_STT_TRANSLATE_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=120,
        )

    if not response.ok:

        print(
            f"\n❌ Sarvam returned "
            f"{response.status_code}"
        )

        print(
            f"Response body: "
            f"{response.text}\n"
        )

        response.raise_for_status()

    return response.json().get(
        "transcript",
        ""
    )


def transcribe_chunk_sarvam(
    chunk_path: str
) -> str:
    """
    Sarvam sync API only accepts ≤30s audio.

    Split the chunk into 25-second pieces,
    send each separately, and join transcripts.
    """

    if not SARVAM_API_KEY:

        raise RuntimeError(
            "SARVAM_API_KEY is not set "
            "in backend/.env"
        )

    audio = AudioSegment.from_wav(
        chunk_path
    )

    piece_ms = (
        SARVAM_PIECE_SECONDS * 1000
    )

    full_text = ""

    total_pieces = (
        len(audio) + piece_ms - 1
    ) // piece_ms

    for i, start in enumerate(
        range(
            0,
            len(audio),
            piece_ms
        )
    ):

        piece = audio[
            start:start + piece_ms
        ]

        piece_path = (
            f"{chunk_path}_sv_{i}.wav"
        )

        piece.export(
            piece_path,
            format="wav"
        )

        try:

            print(
                f"  → Sarvam piece "
                f"{i + 1}/{total_pieces} ..."
            )

            text = _send_to_sarvam(
                piece_path
            )

            full_text += (
                text + " "
            )

        finally:

            if os.path.exists(
                piece_path
            ):
                os.remove(
                    piece_path
                )

    return full_text.strip()


# ============================================================
# LANGUAGE ROUTER
# ============================================================

def transcribe_chunk(
    chunk_path: str,
    language: str = "english"
) -> str:

    """
    Route audio to the appropriate STT service.

    english  → Groq Whisper
    hinglish → Sarvam
    """

    if language.lower() == "hinglish":

        return transcribe_chunk_sarvam(
            chunk_path
        )

    return transcribe_chunk_whisper(
        chunk_path
    )


# ============================================================
# TRANSCRIBE ALL
# ============================================================

def transcribe_all(
    chunks: list,
    language: str = "english"
) -> str:

    full_transcript = ""

    engine = (
        "Sarvam AI"
        if language.lower() == "hinglish"
        else "Groq Whisper"
    )

    print(
        f"Using {engine} for transcription."
    )

    for i, chunk in enumerate(chunks):

        print(
            f"Transcribing chunk "
            f"{i + 1}/{len(chunks)}..."
        )

        text = transcribe_chunk(
            chunk,
            language=language
        )

        full_transcript += (
            text + " "
        )

    print(
        "Transcription complete."
    )

    return full_transcript.strip()