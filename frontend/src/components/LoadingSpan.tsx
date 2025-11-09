// --- NEW INLINE LOADING SPAN COMPONENT ---
const LoadingSpan = () => (
    <>
    <style >{`
        @keyframes blink {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
        }
        .dot-1 { animation: blink 1.4s infinite; }
        .dot-2 { animation: blink 1.4s infinite 0.2s; }
        .dot-3 { animation: blink 1.4s infinite 0.4s; }
    `}</style>
    <span className="ml-4 text-sm font-medium text-gray-500 dark:text-gray-400 inline-flex items-center space-x-0.5">
        Loading
        <span className="inline-flex items-end text-lg leading-none">
            <span className="dot-1 h-3">.</span>
            <span className="dot-2 h-3">.</span>
            <span className="dot-3 h-3">.</span>
        </span>
    </span>
    </>
);

export default LoadingSpan;
