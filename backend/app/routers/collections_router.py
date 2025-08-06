from fastapi import APIRouter, HTTPException, Request
from typing import List, Dict, Any
from app.services.user_collections_service import get_user_collections
from app.core.rate_limiter import limiter
from app.exceptions.global_exceptions import DatabaseConnectionError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/collections",
    tags=["Collections"]
)

@router.get("/", response_model=List[Dict[str, Any]])
@limiter.limit("30/minute")
async def get_user_collections_endpoint(request: Request):
    """
    Get all collections with memory counts for the authenticated user.
    
    Returns:
        List[Dict]: Array of collection objects with 'name' and 'memory_count' fields
    """
    try:
        # Get user ID from request state (set by middleware)
        user_id = getattr(request.state, 'user_id', None)
        if not user_id:
            logger.warning("Unauthorized collections request - missing user ID")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        logger.info(f"📚 COLLECTIONS: Getting collections for user {user_id}")
        
        # Get user's collections from database
        collections = await get_user_collections(user_id)
        
        logger.info(f"📚 COLLECTIONS: Successfully retrieved {len(collections)} collections for user {user_id}")
        return collections
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except DatabaseConnectionError as e:
        logger.error(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=503, detail="Database service unavailable")
    except Exception as e:
        logger.error(f"Unexpected error retrieving collections: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
