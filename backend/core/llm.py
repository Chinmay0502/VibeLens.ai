import os
import time

from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()


GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b"
)


def get_llm():

    return ChatGroq(
        model=GROQ_MODEL,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
        max_retries=0,
    )


def invoke_with_retry(
    chain,
    input_data,
    max_retries=3
):

    for attempt in range(max_retries):

        try:

            return chain.invoke(
                input_data
            )

        except Exception as e:

            error = str(e)

            retryable = (
                "429" in error
                or "rate_limit" in error.lower()
                or "503" in error
                or "UNAVAILABLE" in error
                or "timeout" in error.lower()
            )

            if not retryable:

                raise

            if attempt == max_retries - 1:

                print(
                    "❌ Groq temporarily unavailable "
                    "after all retries."
                )

                return (
                    "The AI model is temporarily unavailable. "
                    "Please try again in a moment."
                )

            wait_time = 2 ** attempt

            print(
                "⚠️ Groq temporarily unavailable."
            )

            print(
                f"   Retrying in {wait_time}s..."
            )

            time.sleep(wait_time)