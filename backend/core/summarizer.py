from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.llm import get_llm, invoke_with_retry

def summarize(transcript: str) -> str:

    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert meeting summarizer. "
            "Provide a clean, professional summary "
            "of this meeting in bullet points."
        ),
        ("human", "{text}")
    ])

    chain = (
        prompt
        | llm
        | StrOutputParser()
    )

    return invoke_with_retry(
        chain,
        {
            "text": transcript[:10000]
        }
    )


def generate_title(
    transcript: str
) -> str:

    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Based on the meeting transcript, "
            "generate a short professional meeting "
            "title (max 8 words). "
            "Only return the title, nothing else."
        ),
        ("human", "{text}")
    ])

    chain = (
        prompt
        | llm
        | StrOutputParser()
    )

    return invoke_with_retry(
        chain,
        {
            "text": transcript[:2000]
        }
    )