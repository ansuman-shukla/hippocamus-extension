import '../index.css';

interface Props {
    handle: () => void;
    text: string;
    textColor: string; 
    iSdisabled ?: boolean;
    IncMinWidth?:string;
    variant?: 'save' | 'search' | 'home' | 'back' | 'showall' | 'close';
    className?: string;
  }
  
  export default function Button({ handle, text, textColor, iSdisabled,IncMinWidth, variant, className }: Props) {
    const resolvedTextColor = textColor === "--primary-white" ? "#151515" : `var(${textColor})`;
    const finalTextColor = variant === 'close' ? '#ffffff' : resolvedTextColor;
    return (
      <button
        type="button"
        onClick={handle}
        style={{color: finalTextColor, minWidth: IncMinWidth ? `${IncMinWidth}`: '118px'}}
        className={`neo-button-filled px-6 py-3 rounded-full ${
                      variant === 'save' ? 'neo-button-variant-save' : ''
                    } ${
                      variant === 'search' ? 'neo-button-variant-search' : ''
                    } ${
                      variant === 'home' ? 'neo-button-variant-home' : ''
                    } ${
                      variant === 'back' ? 'neo-button-variant-back' : ''
                    } ${
                      variant === 'showall' ? 'neo-button-variant-showall' : ''
                    } ${
                      variant === 'close' ? 'neo-button-variant-close' : ''
                    } ${className || ''}
                    inter-500 text-button tracking-wider transition-all duration-200`}
        disabled={iSdisabled}
        
      >
        {iSdisabled ? '' : text}
      </button>
    );
  }
  