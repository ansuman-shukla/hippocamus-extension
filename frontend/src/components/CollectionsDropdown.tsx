import { useState, useEffect } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { getCollections } from '../utils/apiClient';

interface Collection {
  name: string;
  memory_count: number;
}

interface Props {
  selectedCollection: string;
  onSelectionChange: (collection: string) => void;
  isDisabled?: boolean;
}

export default function CollectionsDropdown({ 
  selectedCollection, 
  onSelectionChange, 
  isDisabled = false 
}: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sizing for smooth list animation (panel opens below the fixed button)
  const ITEM_HEIGHT = 40; // px per row
  const MAX_VISIBLE_ITEMS = 5;

  // Fetch collections from API
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        
        // Use apiClient for authenticated requests
        const collectionsData: Collection[] = await getCollections();
        console.log('📚 COLLECTIONS DROPDOWN: Fetched collections:', collectionsData);
        
        // Sort collections by memory_count in descending order
        const sortedCollections = collectionsData.sort((a, b) => b.memory_count - a.memory_count);
        setCollections(sortedCollections);
        
        // Set default selection to highest memory count collection (first in sorted array)
        if (sortedCollections.length > 0 && !selectedCollection) {
          onSelectionChange(sortedCollections[0].name);
        }
      } catch (error: any) {
        console.error('📚 COLLECTIONS DROPDOWN: Error fetching collections:', error);
        
        // Handle different error types gracefully
        if (error.status === 401) {
          console.log('📚 COLLECTIONS DROPDOWN: Unauthorized, user needs to login');
        } else if (error.status === 404) {
          console.log('📚 COLLECTIONS DROPDOWN: No collections endpoint found');
        }
        
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // Get display value for dropdown
  const getDisplayValue = () => {
    if (isLoading) return 'Loading...';
    if (collections.length === 0) return 'collection';
    if (selectedCollection) return selectedCollection;
    return collections[0]?.name || 'collection';
  };

  // Handle collection selection
  const handleSelect = (collectionName: string) => {
    onSelectionChange(collectionName);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      {/* "SAVING IN" Label */}
      <label className="block text-[20px] uppercase tracking-wide text-black" style={{fontWeight: 600}}>
        SAVING IN
      </label>
      
      {/* Collections Dropdown (fixed button, panel expands downward) */}
      <div className="neo-dropdown relative w-fit max-w-[250px]">
        {/* Button remains fixed */}
        <button
          type="button"
          onClick={() => !isDisabled && !isLoading && setIsOpen(!isOpen)}
          disabled={isDisabled || isLoading}
          aria-expanded={isOpen}
          className={`
            neo-dropdown-trigger px-4 h-11 min-w-[200px] max-w-[250px]
            flex items-center justify-between text-black text-sm font-inter bg-white
            ${isDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            transition-all duration-200
          `}
        >
          <span className="truncate">{getDisplayValue()}</span>
          <BsChevronDown
            className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            size={12}
          />
        </button>

        {/* Drop panel attaches to bottom of button with no gap */}
        {!isLoading && (
          <div
            className={`absolute left-0 top-full w-full z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            <div
              className={`
                neo-dropdown-panel overflow-hidden
                transition-[max-height] duration-300 ease-out
              `}
              style={{ maxHeight: isOpen ? `${Math.min(MAX_VISIBLE_ITEMS, collections.length) * ITEM_HEIGHT}px` : '0px' }}
            >
              <div className="neo-dropdown-scroll max-h-[200px] overflow-y-auto scrollbar-hide">
                {collections.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-black/70">No collections yet</div>
                ) : (
                  collections.map((collection) => (
                    <button
                      key={collection.name}
                      type="button"
                      onClick={() => handleSelect(collection.name)}
                      className={`
                        w-full text-left px-4 h-10 text-sm flex items-center transition-colors duration-150 neo-dropdown-item
                        ${selectedCollection === collection.name ? 'bg-black/10 font-medium' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="truncate">{collection.name}</span>
                        <span className="text-xs text-black/60 ml-2">{collection.memory_count}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}