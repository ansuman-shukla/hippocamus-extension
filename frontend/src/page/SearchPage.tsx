import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import ColorChangingSpinner from "../components/Loader";
import { removeCollectionPattern, extractCollectionFromText } from "../utils/collectionUtils";
import { api } from "../utils/apiClient";


interface Props {
    Quote: string;
}



export default function SearchPage({ Quote }: Props) {
    const Navigate = useNavigate();
    const [query, setQuery] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRippling, setIsRippling] = useState<boolean>(false);
    const [rippleColors, setRippleColors] = useState<[string, string]>(["#76ADFF", "#FF8E59"]);
    const [isError, setisError] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    // Vibrant subset: only greens, yellows, oranges (solid, high-contrast)
    const cardColors = [
        '#39ff88', // neon green
        '#48f08b', // green
        '#d7ff40', // electric lime
        '#ff7b00', // bright orange
        '#ff8e59', // orange
        '#ffba00', // marigold
        '#fffa33', // bright yellow
        '#eebc41', // golden yellow
    ];

    const getRandomRipplePair = (): [string, string] => {
        const first = cardColors[Math.floor(Math.random() * cardColors.length)];
        let second = cardColors[Math.floor(Math.random() * cardColors.length)];
        if (second === first) {
            second = cardColors[(cardColors.indexOf(first) + 5) % cardColors.length];
        }
        // Make them more visible by adding transparency for box-shadow color
        const toRGBA = (hex: string, alpha: number) => {
            const sanitized = hex.replace('#', '');
            const bigint = parseInt(sanitized, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        return [toRGBA(first, 0.9), toRGBA(second, 0.7)];
    };

    // const tabs = ["All", "Bookmarks", "Notes"];

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            console.log('🔍 SEARCH: Starting search request via apiClient');
            console.log('📝 SEARCH: Original query:', query);
            
            // Extract collection from query using @collection syntax
            const extractedCollection = extractCollectionFromText(query);
            const cleanedQuery = removeCollectionPattern(query);
            
            console.log('🔍 SEARCH: Extracted collection:', extractedCollection);
            console.log('🧹 SEARCH: Cleaned query:', cleanedQuery);
            
            const requestBody: any = {
                query: cleanedQuery
            };
            
            // Only use collection filtering (tab filtering disabled)
            if (extractedCollection) {
                requestBody.filter = { collection: { $eq: extractedCollection } };
                console.log('🎯 SEARCH: Adding collection filter:', extractedCollection);
            }
            
            console.log('📤 SEARCH: Final request body being sent:', JSON.stringify(requestBody, null, 2));

            const response = await api.post('/links/search', requestBody);
            
            console.log('📥 SEARCH: Response received:', response);
            
            if (response?.detail === "Search failed: No documents found matching query") {
                Navigate("/response", { state: { data: [] } });
                return;
            } else {
                console.log("The response is:", response);
                const responseArray = response.map((item: any) => ({
                    title: item.metadata.title,
                    url: item.metadata.source_url,
                    content: removeCollectionPattern(item.metadata.note),
                    date: item.metadata.date,
                    ID: item.metadata.doc_id,
                    type: item.metadata.type
                }));
                Navigate("/response", { state: { data: responseArray, Query: query } });
            }
        } catch (error: any) {
            console.log("Search completed with no results:", error?.message);
            
            // Handle 404 or "No documents found" as normal no results case
            if (error?.status === 404 || error?.message?.includes("No documents found matching query")) {
                Navigate("/response", { state: { data: [], Query: query } });
            } else {
                Navigate("/response", { state: { data: [], Query: query, error: error?.message || "Search failed" } });
            }
        } finally {
            setIsLoading(false);
        }
    };
    const handleSearchAll = async () => {
        setIsLoading(true);
        try {
            console.log('🔍 SEARCH: Starting searchAll request via apiClient');
            
            // Make both API calls in parallel
            const [linksData, notesData] = await Promise.all([
                api.get('/links/get'),
                api.get('/notes/')
            ]);
            
            console.log('📦 SEARCH: Links data received via apiClient');
            console.log('📦 SEARCH: Notes data received via apiClient');
            
            const linksArray = linksData.map((item: any) => ({
                title: item.title,
                url: item.source_url,
                content: removeCollectionPattern(item.note),
                date: item.date,
                ID: item.doc_id,
                type: item.type
            }));
            const notesArray = notesData.map((item: any) => ({
                title: item.title,
                content: removeCollectionPattern(item.note),
                date: item.date,
                ID: item.doc_id,
                type: item.type
            }));
            
            console.log("The links array is from search all: ", linksArray);
            console.log("The notes array is from search all:", notesArray);
            const responseArray = [...linksArray, ...notesArray];
            Navigate("/response", { state: {data: responseArray, Query: " ", isSearchAll:true} });
            
        } catch (error: any) {
            console.error("SearchAll Error:", error);
            
            // Enhanced authentication error detection
            const errorMessage = error?.message || '';
            const isAuthError = (
                errorMessage.includes('Authentication required') ||
                errorMessage.includes('authentication failed') ||
                errorMessage.includes('fetch failed: 401') ||
                errorMessage.includes('401') ||
                errorMessage.includes('Session expired') ||
                errorMessage.includes('Please log in again') ||
                errorMessage.includes('Invalid Refresh Token')
            );
            
            if (isAuthError) {
                console.log("🚫 SEARCH: Authentication error detected, redirecting to intro page");
                Navigate("/");
                return;
            }
            
            // Handle other errors
            Navigate("/response", { 
                state: { 
                    data: [], 
                    Query: " ", 
                    isSearchAll: true, 
                    error: error?.message || "Failed to fetch data" 
                } 
            });
        } finally {
            setIsLoading(false);
        }
    };




    return (
        <>

                <div className="max-w-md bg-white rounded-lg px-10 w-[420px] h-[500px] flex flex-col  justify-between py-10 border border-black">
                    <div className=" flex flex-col gap-2 ">
                    <div
                        className={`relative flex border-black border-[1.5px] rounded-full px-4 py-1 justify-between min-h-[43px]
                font-SansText400 ripple-wrapper ${isRippling ? 'ripple-active' : ''}`}
                        style={{
                            // Pass vibrant colors to CSS as ring colors
                            // First and second ring colors
                            ['--ripple-color-1' as any]: rippleColors[0],
                            ['--ripple-color-2' as any]: rippleColors[1]
                        }}
                        onMouseDown={() => setIsRippling(false)}
                        onClick={() => setIsRippling(false)}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="SEARCH BOOKMARKS & NOTES - PRESS ENTER"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                // If a ripple is already running, ignore this keystroke to allow it to finish
                                if (!isRippling) {
                                    setIsRippling(true);
                                    setRippleColors(getRandomRipplePair());
                                    // End ripple strictly after animation duration (matches CSS 2.1s + delay margin)
                                    window.clearTimeout((window as any).__rippleTimeout);
                                    (window as any).__rippleTimeout = window.setTimeout(() => setIsRippling(false), 2200);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (query.length < 3) {
                                        setisError(true)
                                    }
                                    else {
                                        handleSearch();
                                    }
                                }
                            }}
                            className="bg-transparent focus:outline-none text-black placeholder:text-[11px] placeholder:text-black flex-grow
                            font-rubik pb-[1px] placeholder:tracking-widest
                            placeholdder-opacity-25 transition-all duration-300 ease-in-out"
                        />

                        {isLoading && (
                            <div>
                                <ColorChangingSpinner />
                            </div>
                        )}
                    </div>
                </div>

                <div className={`font-rubik  text-4xl text-center ${isError ? "text-red-900" : "text-black"}`}>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="text-center"
                    >"{isError ? "The Query must be atleast 3 characters !" : Quote}"</motion.h1>
                </div>
                <div className="w-[95%] mx-auto flex justify-between items-center">
                    <Button text="HOME" handle={() => Navigate("/submit")} textColor="--primary-white"
                        IncMinWidth="118px" />
                    <Button 
                        text={query.trim() ? "SEARCH" : "SHOW ALL"} 
                        handle={query.trim() ? handleSearch : handleSearchAll} 
                        textColor="--primary-white" 
                    />
                </div>
            </div>
        </>
    );
}