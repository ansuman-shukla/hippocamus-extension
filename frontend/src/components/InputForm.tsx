import { useEffect, useRef } from "react";
import Button from "./Button";
import LoaderPillars from "./LoaderPillars";
import CollectionsDropdown from "./CollectionsDropdown";

interface Props {
  handleSubmit: any,
  handleClear: any,
  formData: FormData,
  handleChange: any
  BtnTxtClr: string
  leftBtnTxt: string,
  rightBtnTxt: string
  showOnlyOne?: boolean;
  Error?: string;
  isLoading?: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  extraNote: string;
  setExtraNote: (note: string) => void;
  NotesTitle: string;
  setNotesTitle: (title: string) => void;
  selectedCollection: string;
  setSelectedCollection: (collection: string) => void;
}
interface FormData {
  link: string;
  title: string;
  note: string;
}

export default function InputForm({
  handleSubmit,
  handleChange,
  handleClear,
  formData,
  BtnTxtClr,
  leftBtnTxt,
  rightBtnTxt,
  showOnlyOne,
  Error,
  isLoading,
  extraNote,
  setExtraNote,
  NotesTitle,
  setNotesTitle,
  setCurrentTab,
  selectedCollection,
  setSelectedCollection
}: Props) {
  const showNotes = false; // Fixed to always show bookmarks form
  const notesTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const titleTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const bookmarkNoteRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus on bookmark note area when extension opens (default behavior)
  useEffect(() => {
    if (!showNotes && bookmarkNoteRef.current && !isLoading && !showOnlyOne) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        bookmarkNoteRef.current?.focus();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [showNotes, isLoading, showOnlyOne]);
  
  // Focus the notes text area when notes tab becomes active
  useEffect(() => {
    if (showNotes && notesTextAreaRef.current && !isLoading && !showOnlyOne) {
      // Small delay to ensure the transition animation completes
      const timer = setTimeout(() => {
        notesTextAreaRef.current?.focus();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [showNotes, isLoading, showOnlyOne]);

  useEffect(()=>{
    if(showNotes){
      setCurrentTab("notes")
    }else{
      setCurrentTab("submit")
    }
  },[showNotes])


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message at Top */}
      {Error && (
        <div className="text-center space-y-2 py-4 mb-4">
          <h2 className="text-2xl font-bold text-black font-rubik">Error!</h2>
          <p className="text-lg text-black font-rubik">{Error}</p>
        </div>
      )}
      
      {/* Collections Dropdown - Hidden when there's an error or success */}
      {!Error && leftBtnTxt !== "CLOSE" && (
        <CollectionsDropdown 
          selectedCollection={selectedCollection}
          onSelectionChange={setSelectedCollection}
          isDisabled={isLoading}
        />
      )}
      
      {/* Success Message at Top */}
      {!Error && leftBtnTxt === "CLOSE" && (
        <div className="text-center space-y-2 py-4 mb-4">
          <h2 className="text-2xl font-bold text-black font-rubik">Successful!</h2>
          <p className="text-lg text-black font-rubik">Your entry has been saved.</p>
        </div>
      )}
      {!showNotes ? (<div
        className={`form-input-div space-y-3 transition-all duration-500 ${Error || leftBtnTxt === "CLOSE" ? 'mt-2' : 'mt-6'} ${
          showNotes ? "opacity-0 pointer-events-none " : "opacity-100"
        }`}
      >
        <div className="space-y-2">
          <label className="block text-[18px] font-semibold font-rubik">Link:</label>
          <input
            type="text"
            name="link"
            autoComplete="off"
            value={formData.link}
            onChange={handleChange}
            className="w-full border-b border-black bg-transparent focus:outline-none  pb-1 placeholder-[#151515] text-[16px] placeholder-opacity-25"
            placeholder="Your link here"
            disabled={isLoading || leftBtnTxt === "CLOSE"}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[18px] font-semibold font-rubik">Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border-b text-[16px] border-black bg-transparent focus:outline-none pb-1 placeholder-[#151515] placeholder-opacity-25"
            placeholder="Your title here"
            disabled={isLoading || leftBtnTxt === "CLOSE"}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[18px] font-semibold font-rubik">Note:</label>
          <textarea
            ref={bookmarkNoteRef}
            name="note"
            rows={2}
            value={formData.note}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (formData.link.trim() !== "" && formData.title.trim() !== "" && formData.note.trim() !== "") {
                  handleSubmit(e);
                }
              }
            }}
            className="w-full text-[15px] border-b border-black bg-transparent focus:outline-none placeholder-[#151515] placeholder-opacity-25 py-1 scrollbar-hide"
            placeholder="Add micro-note for better search results (press Enter to save)"
            disabled={isLoading || leftBtnTxt === "CLOSE"}
          />
        </div>

      </div>) :

      (<div
        className={`space-y-2 transition-all duration-500 w-full pb-1 ${
          showNotes ? "opacity-100 translate-y-0 z-10" : "opacity-0 pointer-events-none -translate-y-10"
        }`}
      >
        <label className="block text-md font-SansMono400 text-[18px] ">Title:</label>
        <textarea
          ref={titleTextAreaRef}
          rows={1}
          value={NotesTitle}
          onChange={e => setNotesTitle(e.target.value)}
          className="w-full text-[15px] bg-transparent focus:outline-none placeholder-[#151515] placeholder-opacity-25 py-3  border-b border-black scrollbar-hide"
          placeholder="Your title here..."
          disabled={isLoading || showOnlyOne}
        />
        <label className="block text-md font-SansMono400 text-[18px] ">Note:</label>
        <textarea
          ref={notesTextAreaRef}
          rows={2}
          value={extraNote}
          onChange={e => setExtraNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (NotesTitle.trim() !== "" && extraNote.trim() !== "") {
                handleSubmit(e);
              }
            }
          }}
          className="w-full text-[15px] bg-transparent focus:outline-none placeholder-[#151515] placeholder-opacity-25 py-3  border-b border-black scrollbar-hide"
          placeholder="Write your note here... (Press Enter to save)"
          disabled={isLoading || showOnlyOne}
        />
      </div>)}





      <div className={`flex ${leftBtnTxt === "CLOSE" ? 'justify-center' : 'justify-between'} mx-auto ${Error || leftBtnTxt === "CLOSE" ? "pt-4" : "pt-8"}`} style={{ marginTop: '6px' }}>
        {isLoading ? (
          <div className="flex justify-center w-full">
            <LoaderPillars />
          </div>
        ) : (
          <>
            <Button handle={handleClear} text={leftBtnTxt} textColor={BtnTxtClr} iSdisabled={false} />
            {leftBtnTxt === "CLOSE" ? null : <Button handle={handleSubmit} text={rightBtnTxt} textColor={BtnTxtClr} IncMinWidth="129px" iSdisabled={false} />}
          </>
        )}
      </div>
    </form>
  );
}