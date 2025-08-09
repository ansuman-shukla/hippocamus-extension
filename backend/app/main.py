from jose import jwt, JWTError
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from app.core.config import settings
from app.routers.bookmarkRouters import router as bookmark_router
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi.middleware.cors import CORSMiddleware
from app.routers.get_quotes import router as get_quotes_router
from app.routers.notesRouter import router as notes_router
from app.routers.auth_router import router as auth_router
from app.routers.collections_router import router as collections_router
from app.exceptions.global_exceptions import (
    global_exception_handler,
    AuthenticationError,
    create_error_response
)
from app.core.database_wrapper import get_database_health
from app.core.pinecone_wrapper import get_pinecone_health
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

load_dotenv()

import logging
from datetime import datetime

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Helper functions for authentication middleware
def validate_user_id(payload, context="token"):
    user_id = payload.get("sub")
    if not user_id:
        logger.warning(f"Missing user ID in {context}")
        return None, create_error_response("Invalid payload", 401, "auth_error")
    return user_id, None

def create_auth_error_response(message, status_code=401):
    """Create a standardized authentication error response"""
    return create_error_response(
        message,
        status_code=status_code,
        error_type="auth_error"
    )


# Import the limiter from the dedicated module to avoid circular imports
from app.core.rate_limiter import limiter

# Create FastAPI app with enhanced error handling and disabled documentation
app = FastAPI(
    title="HippoCampus API",
    description="I help you remember everything",
    version="1.0.0",
    docs_url=None,     # Disable Swagger UI
    redoc_url=None,    # Disable ReDoc
    openapi_url=None   # Disable OpenAPI JSON endpoint
)

# Add rate limiter to app state and configure middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.middleware("http")
async def authorisation_middleware(request: Request, call_next):
    """
    Simplified authentication middleware using direct JWT handling
    """
    logger.info(f"Incoming request: {request.method} {request.url.path}")

    # Skip auth for some public endpoints
    if request.url.path in ["/health", "/health/detailed"] or request.url.path.startswith("/quotes") or request.url.path.startswith("/auth"):
        return await call_next(request)

    try:
        # Check both cookies and Authorization header
        auth_header = request.headers.get("authorization")
        
        logger.info(f"🔍 AUTH CHECK: Request details:")
        logger.info(f"   ├─ Authorization header: {auth_header[:50] + '...' if auth_header else 'None'}")
        
        # If no cookie, try to extract from Authorization header
        if auth_header:
            if auth_header.lower().startswith("bearer "):
                access_token = auth_header[7:].strip()
                logger.info(f"   └─ Extracted token from Authorization header")
        
        if not access_token:
            logger.warning("❌ AUTH: Access token missing from Authorization header")
            return create_auth_error_response("Access token is missing")

        # Decode the JWT token directly
        payload = jwt.decode(
            token=access_token,
            key=settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": True},
            audience="authenticated"
        )

        # Validate sub claim
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("JWT missing subject (user ID)")
            return create_auth_error_response("Invalid JWT payload")

        logger.info(f"Access token valid for user: {user_id}")

        # Set user_id in the request state
        request.state.user_id = user_id

        # Continue the request
        response = await call_next(request)
        return response

    except JWTError as e:
        logger.error(f"JWT validation failed: {str(e)}")
        return create_auth_error_response("Invalid token")

    except HTTPException as e:
        logger.error(f"HTTP exception during token validation: {e.detail}")
        return create_error_response(e.detail, status_code=e.status_code, error_type="auth_error")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return create_error_response("Authentication service temporarily unavailable", status_code=503, error_type="auth_service_error")


# Add global exception handler
app.add_exception_handler(Exception, global_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "HippoCampus API"
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check including database and external services"""
    try:
        db_health = await get_database_health()
        pinecone_health = await get_pinecone_health()

        overall_status = "healthy"
        if (db_health.get("status") != "healthy" or
            pinecone_health.get("status") != "healthy"):
            overall_status = "degraded"

        return {
            "status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "services": {
                "database": db_health,
                "vector_db": pinecone_health
            }
        }
    except Exception as e:
        logger.error(f"Error in detailed health check: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": "Health check failed"
            }
        )

app.include_router(bookmark_router)
app.include_router(get_quotes_router)
app.include_router(notes_router)
app.include_router(auth_router)
app.include_router(collections_router)
