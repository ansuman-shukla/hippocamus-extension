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

  // Fetch collections from API
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        
        // Use apiClient for authenticated requests
        const collectionsData: Collection[] = await getCollections();
        console.log('📚 COLLECTIONS DROPDOWN: Fetched collections:', collectionsData);
        
        // Collections are already sorted by memory_count (descending) from backend
        setCollections(collectionsData);
        
        // Set default selection to highest memory count collection (first in array)
        if (collectionsData.length > 0 && !selectedCollection) {
          onSelectionChange(collectionsData[0].name);
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
    <div className="space-y-2 mb-6">
      {/* "SAVING IN" Label */}
      <label className="block text-sm font-SansMono400 uppercase tracking-wide text-black">
        SAVING IN
      </label>
      
      {/* Collections Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !isDisabled && !isLoading && setIsOpen(!isOpen)}
          disabled={isDisabled || isLoading}
          className={`
            w-full bg-[#ffea67] border border-black rounded-full px-4 py-2.5 
            flex items-center justify-between font-SansMono400 text-black text-sm
            ${isDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#ffe54d] cursor-pointer'}
            transition-colors duration-200 min-h-[40px]
          `}
        >
          <span className="truncate">{getDisplayValue()}</span>
          <BsChevronDown 
            className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            size={12} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black rounded-lg shadow-lg z-50">
            <div className="py-1 max-h-[200px] overflow-y-auto scrollbar-hide">
              {collections.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500 font-SansMono400">
                  No collections yet
                </div>
              ) : (
                collections.map((collection) => (
                  <button
                    key={collection.name}
                    type="button"
                    onClick={() => handleSelect(collection.name)}
                    className={`
                      w-full text-left px-4 py-2 text-sm font-SansMono400 
                      hover:bg-gray-100 transition-colors duration-150
                      ${selectedCollection === collection.name ? 'bg-[#ffea67]' : ''}
                      min-h-[40px] flex items-center
                    `}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="truncate">{collection.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {collection.memory_count}
                      </span>
                    </div>
                  </button>
                ))
              )}
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