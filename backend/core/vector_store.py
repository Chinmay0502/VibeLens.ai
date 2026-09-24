import os

from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from qdrant_client.models import Filter, FieldCondition, MatchValue
from core.embeddings import get_embedding


load_dotenv()


COLLECTION_NAME = "vibelens_chunks"


def get_qdrant_client():
    return QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
        timeout=60
    )

def ensure_payload_index():

    client = get_qdrant_client()

    collection_info = client.get_collection(
        collection_name=COLLECTION_NAME
    )

    payload_schema = collection_info.payload_schema

    if "metadata.meeting_id" not in payload_schema:

        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="metadata.meeting_id",
            field_schema="keyword"
        )

        print("Qdrant meeting_id index created")

    else:

        print("Qdrant meeting_id index already exists")


def build_vector_store(transcript: str, meeting_id: str) -> QdrantVectorStore:
    print("Building Qdrant vector store")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_text(transcript)

    docs = [
        Document(
            page_content=chunk,
            metadata={
                "meeting_id": meeting_id,
                "chunk_index": i
            }
        )
        for i, chunk in enumerate(chunks)
    ]

    embedding = get_embedding()

    vector_store = QdrantVectorStore.from_documents(
        documents=docs,
        embedding=embedding,
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
        collection_name=COLLECTION_NAME,
        batch_size=4,
        timeout=60
    )

    ensure_payload_index()

    return vector_store

def load_vector_store() -> QdrantVectorStore:

    embedding = get_embedding()

    vector_store = QdrantVectorStore(
        client=get_qdrant_client(),
        collection_name=COLLECTION_NAME,
        embedding=embedding
    )

    return vector_store


def get_retriever(
    vector_store: QdrantVectorStore,
    meeting_id: str,
    k: int = 4
):

    qdrant_filter = Filter(
        must=[
            FieldCondition(
                key="metadata.meeting_id",
                match=MatchValue(value=meeting_id)
            )
        ]
    )

    return vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": k,
            "filter": qdrant_filter
        }
    )