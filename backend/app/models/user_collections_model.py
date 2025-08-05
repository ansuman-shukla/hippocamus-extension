from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class UserCollections(BaseModel):
    """
    Model for tracking collections created by each user
    """
    userId: str = Field(..., description="Unique identifier for the user")
    collections: List[str] = Field(default_factory=list, description="List of collection names created by the user")
    
    class Config:
        """Pydantic configuration"""
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "userId": "user_123456789",
                "collections": ["ai", "books", "coding", "research"]
            }
        }

def user_collections_model(user_collections_data: dict) -> dict:
    """
    Convert database document to API response format
    """
    try:
        return {
            "userId": user_collections_data.get("userId"),
            "collections": user_collections_data.get("collections", [])
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
