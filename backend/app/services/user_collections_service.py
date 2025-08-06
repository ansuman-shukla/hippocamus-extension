from typing import List, Optional
import logging
from app.core.database_wrapper import safe_collection_user_collections
from app.models.user_collections_model import user_collections_model
from app.exceptions.global_exceptions import DatabaseConnectionError
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

async def ensure_user_collection_exists(user_id: str) -> dict:
    """
    Ensure that a user document exists in the user_collections table.
    If it doesn't exist, create it with an empty collections array.
    """
    try:
        logger.info(f"📚 COLLECTIONS: Ensuring user collection document exists for user {user_id}")
        
        # Check if user document already exists
        existing_doc = await safe_collection_user_collections.find_one({"userId": user_id})
        
        if existing_doc:
            logger.info(f"📚 COLLECTIONS: User collection document already exists for user {user_id}")
            return user_collections_model(existing_doc)
        
        # Create new user collections document
        new_user_collections = {
            "userId": user_id,
            "collections": []
        }
        
        result = await safe_collection_user_collections.insert_one(new_user_collections)
        
        if not result.inserted_id:
            raise Exception("Failed to create user collections document")
        
        logger.info(f"📚 COLLECTIONS: Created new user collection document for user {user_id}")
        return user_collections_model(new_user_collections)
        
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    except PyMongoError as e:
        logger.error(f"Database error ensuring user collection exists: {str(e)}")
        raise Exception(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error ensuring user collection exists: {str(e)}", exc_info=True)
        raise Exception(f"Error ensuring user collection exists: {str(e)}")

async def add_collection_to_user(user_id: str, collection_name: str) -> bool:
    """
    Add a collection to a user's collections array if it doesn't already exist.
    Returns True if collection was added, False if it already existed.
    This function only creates the collection - use increment_memory_count to add memories.
    """
    try:
        logger.info(f"📚 COLLECTIONS: Adding collection '{collection_name}' to user {user_id}")
        
        # Ensure user document exists
        await ensure_user_collection_exists(user_id)
        
        # Check if collection already exists in user's array (handle both old and new formats)
        existing_doc = await safe_collection_user_collections.find_one({
            "userId": user_id,
            "$or": [
                {"collections": collection_name},  # Old format (string)
                {"collections.name": collection_name}  # New format (object)
            ]
        })
        
        if existing_doc:
            logger.info(f"📚 COLLECTIONS: Collection '{collection_name}' already exists for user {user_id}")
            return False
        
        # Add collection as object with memory_count 0
        collection_obj = {"name": collection_name, "memory_count": 0}
        result = await safe_collection_user_collections.update_one(
            {"userId": user_id},
            {"$addToSet": {"collections": collection_obj}}
        )
        
        if result.modified_count > 0:
            logger.info(f"📚 COLLECTIONS: Successfully added collection '{collection_name}' to user {user_id}")
            return True
        else:
            logger.warning(f"📚 COLLECTIONS: No changes made when adding collection '{collection_name}' to user {user_id}")
            return False
            
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    except PyMongoError as e:
        logger.error(f"Database error adding collection to user: {str(e)}")
        raise Exception(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error adding collection to user: {str(e)}", exc_info=True)
        raise Exception(f"Error adding collection to user: {str(e)}")

async def increment_memory_count(user_id: str, collection_name: str) -> bool:
    """
    Increment the memory count for a specific collection.
    Creates the collection if it doesn't exist.
    Returns True if count was incremented successfully.
    """
    try:
        logger.info(f"📚 COLLECTIONS: Incrementing memory count for collection '{collection_name}' for user {user_id}")
        
        # Ensure user document exists
        await ensure_user_collection_exists(user_id)
        
        # First, try to increment if collection exists in new format
        result = await safe_collection_user_collections.update_one(
            {"userId": user_id, "collections.name": collection_name},
            {"$inc": {"collections.$.memory_count": 1}}
        )
        
        if result.modified_count > 0:
            logger.info(f"📚 COLLECTIONS: Successfully incremented memory count for collection '{collection_name}' for user {user_id}")
            return True
        
        # Check if collection exists in old format (string) and convert it
        existing_doc = await safe_collection_user_collections.find_one({
            "userId": user_id,
            "collections": collection_name
        })
        
        if existing_doc:
            # Remove old string format and add new object format with count 1
            await safe_collection_user_collections.update_one(
                {"userId": user_id},
                {
                    "$pull": {"collections": collection_name},
                    "$addToSet": {"collections": {"name": collection_name, "memory_count": 1}}
                }
            )
            logger.info(f"📚 COLLECTIONS: Converted and incremented collection '{collection_name}' from old format for user {user_id}")
            return True
        
        # Collection doesn't exist, create it with count 1
        collection_obj = {"name": collection_name, "memory_count": 1}
        result = await safe_collection_user_collections.update_one(
            {"userId": user_id},
            {"$addToSet": {"collections": collection_obj}}
        )
        
        if result.modified_count > 0:
            logger.info(f"📚 COLLECTIONS: Created new collection '{collection_name}' with memory count 1 for user {user_id}")
            return True
        else:
            logger.warning(f"📚 COLLECTIONS: Failed to create or increment collection '{collection_name}' for user {user_id}")
            return False
            
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    except PyMongoError as e:
        logger.error(f"Database error incrementing memory count: {str(e)}")
        raise Exception(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error incrementing memory count: {str(e)}", exc_info=True)
        raise Exception(f"Error incrementing memory count: {str(e)}")

async def get_user_collections(user_id: str) -> List[dict]:
    """
    Get list of all collections with their memory counts for a specific user.
    Returns list of objects with 'name' and 'memory_count' fields.
    """
    try:
        logger.info(f"📚 COLLECTIONS: Retrieving collections for user {user_id}")
        
        # Ensure user document exists first
        await ensure_user_collection_exists(user_id)
        
        # Get user's collections
        user_doc = await safe_collection_user_collections.find_one({"userId": user_id})
        
        if not user_doc:
            logger.warning(f"📚 COLLECTIONS: No collections document found for user {user_id}")
            return []
        
        # Use the model formatter to handle both old and new formats
        formatted_data = user_collections_model(user_doc)
        collections = formatted_data.get("collections", [])
        
        logger.info(f"📚 COLLECTIONS: Retrieved {len(collections)} collections for user {user_id}")
        
        return collections
        
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    except PyMongoError as e:
        logger.error(f"Database error retrieving user collections: {str(e)}")
        raise Exception(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error retrieving user collections: {str(e)}", exc_info=True)
        raise Exception(f"Error retrieving user collections: {str(e)}")

async def remove_collection_from_user(user_id: str, collection_name: str) -> bool:
    """
    Remove a collection from a user's collections array.
    Returns True if collection was removed, False if it didn't exist.
    """
    try:
        logger.info(f"📚 COLLECTIONS: Removing collection '{collection_name}' from user {user_id}")
        
        result = await safe_collection_user_collections.update_one(
            {"userId": user_id},
            {"$pull": {"collections": collection_name}}
        )
        
        if result.modified_count > 0:
            logger.info(f"📚 COLLECTIONS: Successfully removed collection '{collection_name}' from user {user_id}")
            return True
        else:
            logger.info(f"📚 COLLECTIONS: Collection '{collection_name}' was not found for user {user_id}")
            return False
            
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    except PyMongoError as e:
        logger.error(f"Database error removing collection from user: {str(e)}")
        raise Exception(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error removing collection from user: {str(e)}", exc_info=True)
        raise Exception(f"Error removing collection from user: {str(e)}")

async def check_collection_exists_for_user(user_id: str, collection_name: str) -> bool:
    """
    Check if a specific collection exists for a user.
    """
    try:
        logger.debug(f"📚 COLLECTIONS: Checking if collection '{collection_name}' exists for user {user_id}")
        
        existing_doc = await safe_collection_user_collections.find_one(
            {"userId": user_id, "collections": collection_name}
        )
        
        exists = existing_doc is not None
        logger.debug(f"📚 COLLECTIONS: Collection '{collection_name}' {'exists' if exists else 'does not exist'} for user {user_id}")
        
        return exists
        
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
    except PyMongoError as e:
        logger.error(f"Database error checking collection existence: {str(e)}")
        raise Exception(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error checking collection existence: {str(e)}", exc_info=True)
        raise Exception(f"Error checking collection existence: {str(e)}")
