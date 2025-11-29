const Config = {
    baseURL: import.meta.env.VITE_API_URL || 
            (import.meta.env.MODE === "development" 
                ? "http://127.0.0.1:8000" 
                : "https://h-check.onrender.com")
}


export default Config;