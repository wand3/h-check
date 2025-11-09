import { createAsyncThunk } from '@reduxjs/toolkit';
import axios, {AxiosError} from 'axios';
import type { RegisterUserInputSchema, RegisterUserOutputSchema, LoginUserOutputSchema } from '../schemas/auth';
import Config from '../config';


// register user thunk
export const registerUser = createAsyncThunk<RegisterUserOutputSchema, RegisterUserInputSchema, { rejectValue: string}> (
  'auth/register',
  async ({ username, email, password }: RegisterUserInputSchema, { rejectWithValue }) => { 
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await axios.post(
        `${Config.baseURL}/auth/register`,
        { username, email, password },
        config
      );
      if (response.status === 201) {
        return response.data
      }
    } catch (error) {
      // Handle Axios errors with type safety
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        if (axiosError.response && axiosError.response.data.message) {
          return rejectWithValue(axiosError.response.data.message);
        }
      }
      // Handle non-Axios errors or generic error messages
      return rejectWithValue((error as Error).message);
    }
  }

);


// Async thunk for login
export const loginUser = createAsyncThunk<
  LoginUserOutputSchema,
  // LoginUserInputSchema,
  {username: string, password: string}, 
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    const formData = new FormData(); // Create FormData object
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    const response = await axios.post<LoginUserOutputSchema>(
      `${Config.baseURL}/token`,
      formData,
      // {username, password},
      config
    );
    console.log('token call')

    localStorage.setItem('token', response.data.access_token); // Store token in local storage
    console.log('token set submit clear errors')
    return response.data; // Return the entire response data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
}); 


// Async thunk for logout
// ArgType is void, ReturnType is void (or a simple success message)
export const logoutUser = createAsyncThunk<void, void>(
  'auth/logout',
  async (_, { }) => {
    try {
      // Client-Side Side Effects (CRITICAL)
      // Regardless of the backend call success/failure, clear the client-side state.
      localStorage.removeItem('token'); 
      localStorage.removeItem('authToken'); 
      // Send request to the backend to invalidate the session/token (optional, but recommended)

      // 3. Dispatch an action to clear the state in the Redux store
      // This action (e.g., 'auth/clearState') is handled in your slice's reducer.
      // We don't need to manually dispatch here, as the `pending/fulfilled/rejected`
      // actions of this thunk will be handled by the reducer.
    
      // This is the same endpoint you defined in FastAPI: /auth/logout
      await axios.post(`${Config.baseURL}/auth/logout`);
      // const navigate = useNavigate();

      return; // Returns nothing on success


    } catch (error) {
      // It's often acceptable to ignore the error on the client side 
      // during logout, as the main goal is to clear the client's state.
      console.error('Logout API call failed, proceeding with local clear:', error);
      // You can choose to rejectWithValue if you need to display an error message
    }
    



    
  }
);