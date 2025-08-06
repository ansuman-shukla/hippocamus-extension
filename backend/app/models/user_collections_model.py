from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class CollectionInfo(BaseModel):
    """
    Model for individual collection information
    """
    name: str = Field(..., description="Name of the collection")
    memory_count: int = Field(default=0, description="Number of memories in this collection")

class UserCollections(BaseModel):
    """
    Model for tracking collections created by each user
    """
    userId: str = Field(..., description="Unique identifier for the user")
    collections: List[CollectionInfo] = Field(default_factory=list, description="List of collections with their memory counts")
    
    class Config:
        """Pydantic configuration"""
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "userId": "user_123456789",
                "collections": [
                    {"name": "ai", "memory_count": 5},
                    {"name": "books", "memory_count": 12},
                    {"name": "coding", "memory_count": 8},
                    {"name": "research", "memory_count": 3}
                ]
            }
        }

def user_collections_model(user_collections_data: dict) -> dict:
    """
    Convert database document to API response format
    Handles both old format (list of strings) and new format (list of objects)
    """
    try:
        collections_data = user_collections_data.get("collections", [])
        formatted_collections = []
        
        for collection in collections_data:
            if isinstance(collection, str):
                # Legacy format - convert string to object with count 0
                formatted_collections.append({
                    "name": collection,
                    "memory_count": 0
                })
            elif isinstance(collection, dict):
                # New format - already an object
                formatted_collections.append({
                    "name": collection.get("name", ""),
                    "memory_count": collection.get("memory_count", 0)
                })
        
        return {
            "userId": user_collections_data.get("userId"),
            "collections": formatted_collections
        }
    except Exception as e:
        logger.error(f"Error formatting user collections data: {str(e)}")
        return {
            "userId": user_collections_data.get("userId"),
            "collections": []
        }

def user_collections_models(user_collections_list: List[dict]) -> List[dict]:
    """
    Convert list of database documents to API response format
    """
    try:
        return [user_collections_model(user_collections) for user_collections in user_collections_list]
    except Exception as e:
        logger.error(f"Error formatting user collections list: {str(e)}")
        return []
