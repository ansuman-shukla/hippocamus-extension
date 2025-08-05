/**
 * Utility functions for handling collection patterns in notes
 */

/**
 * Remove collection pattern from text for clean display
 * @param text - The text to clean
 * @returns Text with collection pattern removed
 * 
 * Examples:
 * removeCollectionPattern("This is about #books: machine learning") -> "This is about machine learning"
 * removeCollectionPattern("#songs: my favorite music") -> "my favorite music"
 */
export function removeCollectionPattern(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // Pattern to match #collectionname: (same as backend)
  const pattern = /\s*#[a-zA-Z0-9_-]+:\s*/g;
  
  try {
    const cleanedText = text.replace(pattern, '').trim();
    return cleanedText || text;
  } catch (error) {
    console.error('Error removing collection pattern from text:', error);
    return text;
  }
}

/**
 * Extract collection name from text using the pattern #collectionname:
 * @param text - The text to search for collection pattern
 * @returns The extracted collection name or null if no pattern found
 */
export function extractCollectionFromText(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Pattern to match #collectionname: where collectionname can contain letters, numbers, underscores, hyphens
  const pattern = /#([a-zA-Z0-9_-]+):/;
  
  try {
    const match = text.match(pattern);
    if (match && match[1]) {
      const collectionName = match[1].toLowerCase().trim();
      // Validate collection name (basic validation)
      if (collectionName.length > 0 && collectionName.length <= 50) {
        return collectionName;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting collection from text:', error);
    return null;
  }
} 