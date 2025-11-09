import type {FlashContextType} from "../context/FlashProvider";
import FlashContext from "../context/FlashProvider";
import { useContext } from "react";



export const FlashMessage = () => {
    const { flashMessage, hideFlash, visible } = useContext(FlashContext) as FlashContextType;
    // const { hideFlash, flashMessage, visible } = useContext(FlashContext);

    const baseStyles = "absolute mx-auto top-6 right-1 p-4 rounded shadow-md text-white w-fit z-15";

    const typeStyle: Record<string, string> = {
        success: "text-green-500",
        error: "text-red-500",
        warning: "text-yellow-500",
        info: "text-blue-500"
    }

    // Determine the style based on the flash message type
    const alertType = flashMessage?.type || "info"; // Default to 'info' if type is missing

    return (
            visible && (
                <div role="alert" className={`rounded-xl border border-gray-100 bg-white p-4 ${baseStyles}`}>
                    <div className="flex items-start gap-1">
                        <span className=''>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className={`size-6 ${typeStyle[alertType]}`}
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        </span>

                        <div className="flex-1">
                        {/* <strong className="block font-medium">{alertType}</strong> */}

                        <p className="mt-1 text-sm text-gray-700">{flashMessage.message}</p>
                        </div>

                        <button className="text-gray-500 transition hover:text-gray-600" onClick={hideFlash}>
                        <span className="sr-only">Dismiss popup</span>

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </div>
                    </div>
            )
        );
          
}

export default FlashMessage;





