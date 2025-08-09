from pinecone import Pinecone
from app.core.config import settings
from pinecone import Pinecone, ServerlessSpec
import os

index_name = settings.PINECONE_INDEX
GEMINI_API_KEY = settings.GEMINI_API_KEY
pc = Pinecone(api_key=settings.PINECONE_API_KEY)


# Initialize Pinecone index
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1024,  # E5-large requires 1024 dimensions
        metric="cosine",  # E5 works best with cosine similarity
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )

index = pc.Index(index_name)