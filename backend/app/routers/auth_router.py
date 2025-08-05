from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.utils.jwt import decodeJWT
import logging
import time

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    access_token: str
    refresh_token: str

@router.get("/status")
async def auth_status(request: Request):
    """
    Check authentication status and validate current token
    """

    # Check both cookies and Authorization header for tokens
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    
    # If no access token in cookies, check Authorization header
    if not access_token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            access_token = auth_header[7:].strip()
            logger.info(f"   ├─ Access token extracted from Authorization header")
    
    logger.info(f"   ├─ Access token present: {bool(access_token)}")
    logger.info(f"   ├─ Refresh token present: {bool(refresh_token)}")

    result = {
        "has_access_token": bool(access_token),
        "has_refresh_token": bool(refresh_token),
        "is_authenticated": False,
        "user_id": None,
        "token_valid": False
    }
    
    if access_token:
        try:
            payload = await decodeJWT(access_token)
            user_metadata = payload.get("user_metadata", {})

            result.update({
                "is_authenticated": True,
                "user_id": payload.get("sub"),
                "token_valid": True,
                "user_email": payload.get("email"),
                "user_name": user_metadata.get("full_name"),
                "full_name": user_metadata.get("full_name"),
                "user_picture": user_metadata.get("picture"),
                "picture": user_metadata.get("picture"),
                "token_expires": payload.get("exp")
            })
        except Exception as e:  
                logger.error(f"❌ AUTH STATUS: Access token validation failed: {str(e)}")
                result["token_error"] = str(e)
    else:
        logger.info(f"ℹ️  AUTH STATUS: No access token to validate")
    
    return result
