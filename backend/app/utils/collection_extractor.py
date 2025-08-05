import re
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def extract_collection_from_text(text: Optional[str]) -> Optional[str]:
    """
    Extract collection name from text using the pattern #collectionname:
    
    Args:
        text: The text to search for collection pattern
        
    Returns:
        The extracted collection name or None if no pattern found
        
    Examples:
        extract_collection_from_text("This is about #books: machine learning") -> "books"
        extract_collection_from_text("Regular text without pattern") -> None
        extract_collection_from_text("#music: my favorite songs") -> "music"
    """
    if not text or not isinstance(text, str):
        return None
    
    # Pattern to match #collectionname: where collectionname can contain letters, numbers, underscores, hyphens
    pattern = r'#([a-zA-Z0-9_-]+):'
    
    try:
        match = re.search(pattern, text.strip())
        if match:
            collection_name = match.group(1).lower().strip()
            # Validate collection name (basic validation)
            if len(collection_name) > 0 and len(collection_name) <= 50:
                logger.info(f"Extracted collection: '{collection_name}' from text")
                return collection_name
            else:
                logger.warning(f"Invalid collection name length: '{collection_name}'")
                return None
        return None
    except Exception as e:
        logger.error(f"Error extracting collection from text: {str(e)}")
        return None

def remove_collection_pattern_from_text(text: Optional[str]) -> Optional[str]:
    """
    Remove collection pattern from text for clean searching
    
    Args:
        text: The text to clean
        
    Returns:
        Text with collection pattern removed
        
    Examples:
        remove_collection_pattern_from_text("This is about #books: machine learning") -> "This is about machine learning"
    """
    if not text or not isinstance(text, str):
        return text
    
    # Pattern to match #collectionname: 
    pattern = r'#[a-zA-Z0-9_-]+:\s*'
    
    try:
        cleaned_text = re.sub(pattern, '', text).strip()
        return cleaned_text if cleaned_text else text
    except Exception as e:
        logger.error(f"Error removing collection pattern from text: {str(e)}")
        return text 