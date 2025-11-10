import './App.css';
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import { FlashProvider } from './context/FlashProvider';
import ApiProvider from './context/ApiProvider';
import { UserProvider } from './context/UserProvider';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistePage';


function App() {
  // Define the handler function
  const handleApiError = (error: any) => {
      console.log("An API error occurred:", error);
  };

  return (
    <>
      <FlashProvider>
        <ApiProvider onError={handleApiError}>
            <UserProvider>
              <Routes>
                <Route path="/home" element={ <Home />} />
                <Route path="/login" element={
                    <LoginPage />
                  } />
                <Route path="/register" element={<RegisterPage />
                } />
              </Routes>
            </UserProvider>
        </ApiProvider>
      </FlashProvider>
    </>
  )
}

export default App