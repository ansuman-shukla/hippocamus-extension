import { useNavigate } from "react-router-dom";
import InputForm from "../components/InputForm";
import { useState, useRef } from "react";
import '../index.css';
import isUrlHttp from "is-url-http";
import { submitLink, saveNotes } from "../utils/apiClient";

interface FormData {
  link: string;
  title: string;
  note: string;
}

export default function ResponsePage() {

const [leftBtnTxt, setLftBtnTxt] = useState("SEARCH");
  const [BtnTxtClr, setBtnTxtClr] = useState("--primary-yellow");
  const [rightBtnTxt, setRtBtnTxt] = useState("SAVE");
  const [bgClr, setbgClr] = useState("--primary-yellow");
  const [isError, setisError] = useState('');
  const [showOnlyOne, setShowOnlyOne] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("submit");
  const [extraNote, setExtraNote] = useState("");
  const [NotesTitle, setNotesTitle] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");

  const Navigate = useNavigate();
  const [DoneNumber, setDoneNumber] = useState(0);
  const isNavigating = useRef(false);

  function isValidURL(url:string) {
        console.log("The url is:", url ,"and it is valid", isUrlHttp(url));
        return !isUrlHttp(url);
  }







  const [formData, setFormData] = useState<FormData>({
    link: '',
    title: '',
    note: ''
  });
  const getLink = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setFormData({ ...formData, link: tabs[0].url || '', title: tabs[0].title || '' })
    })
  }
  if (formData.link == "" && DoneNumber == 0) {
    getLink();
    setDoneNumber(1);
  }



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleResponse = async (e: React.FormEvent) => {
    e.preventDefault();


    if (currentTab === "submit" && (formData.link === "" || isValidURL(formData.link) || formData.title === "")) {
      if(isValidURL(formData.link)){
        setisError("Enter a valid link!")
        return
      }
      setisError("Link or Title missing!")
      return
    }
    else if (currentTab === "notes" && (NotesTitle.trim() === "" || extraNote.trim() === "")) {
      setisError("Title and Note are required!")
      return
    }
    else {
      setIsLoading(true);
      setisError('')

      try {
        if (currentTab === "submit") {
          // For bookmarks, append collection to note field if selected from dropdown
          let finalFormData = { ...formData };
          if (selectedCollection) {
            // Check if note already contains @collection pattern
            const existingCollection = formData.note.match(/@([a-zA-Z0-9_-]+)/);
            if (!existingCollection) {
              // Add selected collection to note field if no @collection pattern exists
              finalFormData.note = formData.note ? `@${selectedCollection} ${formData.note}` : `@${selectedCollection}`;
            }
            // If @collection already exists in note, prioritize that over dropdown selection
          }
          
          console.log("Frontend submitting link data:", finalFormData);
          const response = await submitLink(finalFormData);
          console.log("Frontend received link response:", response);
          
          setIsLoading(false);
          setbgClr("--primary-green")
          setLftBtnTxt("CLOSE")
          setBtnTxtClr("--primary-green")
          setRtBtnTxt("HOME")
          setShowOnlyOne(true)
        } else {
          // For notes, use both collection field and note field
          let finalNote = extraNote;
          let collectionForAPI = selectedCollection;
          
          // Check if note contains @collection pattern
          const noteCollectionMatch = extraNote.match(/@([a-zA-Z0-9_-]+)/);
          if (noteCollectionMatch) {
            // If @collection exists in note, use that as priority
            collectionForAPI = noteCollectionMatch[1];
          } else if (selectedCollection) {
            // If no @collection in note but dropdown has selection, add it to note for consistency
            finalNote = `@${selectedCollection} ${extraNote}`;
            collectionForAPI = selectedCollection;
          }
          
          const noteData = {
            title: NotesTitle,
            note: finalNote,
            collection: collectionForAPI || undefined
          };
          
          console.log("Frontend submitting note data:", noteData);
          const response = await saveNotes(noteData);
          console.log("Frontend received note response:", response);
          
          setIsLoading(false);
          setbgClr("--primary-green")
          setLftBtnTxt("CLOSE")
          setBtnTxtClr("--primary-green")
          setRtBtnTxt("HOME")
          setShowOnlyOne(true)
        }
      } catch (error: any) {
        setIsLoading(false);
        console.error("API Error:", error);
        setbgClr("--primary-orange")
        setLftBtnTxt(currentTab === "submit" ? "Home" : "BACK")
        setBtnTxtClr("--primary-orange")
        setRtBtnTxt("RETRY :)")
        setisError(error?.message || "API Error")
      }
    }
  }

  const handleClear = () => {
    // Prevent multiple rapid clicks/navigation
    if (isNavigating.current) {
      return;
    }
    
    // Reset selected collection when clearing form
    setSelectedCollection("");
    
    if (showOnlyOne && leftBtnTxt == "CLOSE") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        if(tabId){
          chrome.tabs.sendMessage(tabId, { 
            action: "closeExtension",
            target: "content"
          }, () => {
          });
        }
      });
    } else if (leftBtnTxt === 'Home') {
      Navigate(0);
    }
    else{
      // Set navigation flag and navigate to search
      isNavigating.current = true;
      Navigate("/search");
      
      // Reset flag after a delay to allow for normal navigation
      setTimeout(() => {
        isNavigating.current = false;
      }, 1000);
    }
  };

  return (
    <>

      <div className={`max-w-md bg-[var(${bgClr})] rounded-lg px-9 w-[420px] h-[500px] flex flex-col justify-between pt-1 pb-8
      border border-black`}>


        <div className="flex justify-between items-center mb-1 gap-2 ">
          <div className='flex flex-col justify-end  -gap-2'>
          </div>
        </div>


        <InputForm
          handleChange={handleChange}
          handleClear={handleClear}
          handleSubmit={handleResponse}
          formData={formData}
          BtnTxtClr={BtnTxtClr}
          leftBtnTxt={leftBtnTxt}
          rightBtnTxt={rightBtnTxt}
          Error={isError}
          showOnlyOne={showOnlyOne}
          isLoading={isLoading}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          extraNote={extraNote}
          setExtraNote={setExtraNote}
          NotesTitle={NotesTitle}
          setNotesTitle={setNotesTitle}
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
        />
        
      </div>
    </>
  );
}