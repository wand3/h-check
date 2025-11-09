'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/shadcn-io/ai/conversation';
import { Loader } from '@/components/ui/shadcn-io/ai/loader';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/shadcn-io/ai/message';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from '@/components/ui/shadcn-io/ai/prompt-input';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ui/shadcn-io/ai/source';
import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';
import { MenuIcon, RotateCcwIcon, User as UserIcon } from 'lucide-react'; // Renamed User to UserIcon
import { nanoid } from 'nanoid';
import { type FormEventHandler, useCallback, useRef, useState } from 'react';

// user provider 
import React from "react";
import useFlash from "../hooks/UseFlash";
// import type { UserSchema } from "../context/UserProvider";
import { useNavigate, useParams } from "react-router-dom";
// import useUser from "../hooks/UseUser";

import type { FhirQueryResponse } from '@/schemas/fhirResponse';
import Config from '@/config';
import { FhirQueryVisualizer } from './Charts';
import { useGetUserDetailsQuery } from '@/services/user';
import { useDispatch, useSelector } from 'react-redux';
// import SpinnerLineWave from './Spinner';
import type { AppDispatch, RootState } from '@/store';
import LoadingSpan from './LoadingSpan';
// import { logoutUser } from '../services/auth'
import { logout } from '../slices/AuthSlice'


const SUGGESTIONS: string[] = [
  'Show me all diabetic patients over 50',
  'List hypertensive patients under 40',
  'Patients with asthma by city',
  'Show female patients over 60 with diabetes',
  'All pediatric patients with immunizations',
];

function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  // Use a ref to store the timeout ID, ensuring it persists across renders
  const timeoutRef = useRef<number | undefined>(undefined);

  // The function returned by useCallback is the debounced function
  return useCallback((...args: Parameters<T>) => {
    // Clear the previous timeout, if it exists
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    // Note: window.setTimeout returns a number (or Node.js Timer object, hence the number type)
    const newTimeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);
    
    // Store the new timeout ID
    timeoutRef.current = newTimeoutId;
  }, [fn, delay]) as T; 
  // We assert the return type back to T to maintain the function signature 
  // and ensure TypeScript knows the debounced function accepts the same arguments.
}

type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
  fhirResponse?: FhirQueryResponse;
};


const FhirBot = () => {

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nanoid(),
      content: "Hello! I'm your AI-powered healthcare data querying tool that interfaces with FHIR-compliant systems. What would you like to know?",
      role: 'assistant',
      timestamp: new Date(),
      sources: [
        { title: "FHIR API", url: "#" },
      ]
    }
  ]);
  useParams();


  // query input and suggestions 
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const flash = useFlash();
  // const api = UseApi();

  // toggle 
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);


  // user 
  // Get the user state from Redux
  // const token = useSelector((state: RootState) => state.user.token);

  const token = useSelector((state: RootState) => state.auth.token);

 

  // Fix the query hook
  const { data: user } = useGetUserDetailsQuery(undefined, {
    pollingInterval: 9000,
    skip: !token,
  });
  //  // Debug the token and user state
  // useEffect(() => {
  //   console.log('Token changed:', token);
  // }, [token]);

  // useEffect(() => {
  //   console.log('User data changed:', user);
  // }, [user]);


  const dispatch = useDispatch<AppDispatch>(); // Type-safe dispatch 

 
  const [isTyping, setIsTyping] = useState(false);
  const [, setStreamingMessageId] = useState<string | null>(null);
  
  // result setting 
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // const simulateTyping = useCallback((messageId: string, content: string, reasoning?: string, sources?: Array<{ title: string; url: string }>) => {
  //   let currentIndex = 0;
  //   const typeInterval = setInterval(() => {
  //     setMessages(prev => prev.map(msg => {
  //       if (msg.id === messageId) {
  //         const currentContent = content.slice(0, currentIndex);
  //         return {
  //           ...msg,
  //           content: currentContent,
  //           isStreaming: currentIndex < content.length,
  //           reasoning: currentIndex >= content.length ? reasoning : undefined,
  //           sources: currentIndex >= content.length ? sources : undefined,
  //         };
  //       }
  //       return msg;
  //     }));
  //     currentIndex += Math.random() > 0.1 ? 1 : 0; // Simulate variable typing speed
      
  //     if (currentIndex >= content.length) {
  //       clearInterval(typeInterval);
  //       setIsTyping(false);
  //       setStreamingMessageId(null);
  //     }
  //   }, 50);
  //   return () => clearInterval(typeInterval);
  // }, []);

  // -----------------------------
  // Execute query (POST) and set results
  // -----------------------------
  
  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      if (!inputValue.trim() || isTyping) return;
      setLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: nanoid(),
        content: inputValue.trim(),
        role: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      try {
        // Send POST request to your backend
        const resp = await fetch(`${Config.baseURL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: inputValue.trim() }),
        });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);

        // Parse FhirQueryResponse
        const data: FhirQueryResponse = await resp.json();
        // console.log(data)
        if (data) {
          setLoading(false);
        }

        // setStreamingMessageId(false);

        // Build assistant message based on the structured response
        const assistantMessageId = nanoid();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          fhirResponse: data,
          timestamp: new Date(),
        };

        // Optional: you could render structured components (charts/tables) from `data.processed_results`
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error('FHIR Query Error:', err);

        const errorMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: '⚠️ Something went wrong while processing your query.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setLoading(false)
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, isTyping]
  );

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: nanoid(),
        content: "Hello! I'm your AI-powered healthcare data querying tool that interfaces with FHIR-compliant systems. What would you like to know?",
        role: 'assistant',
        timestamp: new Date(),
        sources: [
          { title: "FHIR API", url: "#" },
        ]
      }
    ]);
    setInputValue('');
    setIsTyping(false);
    setStreamingMessageId(null);
  }, []);

  // Suggestion fetcher (debounced)
  const debouncedFilter = useDebounce((value) => {
    if (!value.trim()) {
      setSuggestions([]);
    return;
  }
  const filtered = SUGGESTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
    setSuggestions(filtered);
  }, 300);


  const handleChange = (e : React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedFilter(value);
  };

  const navigate = useNavigate();
  const handleLogout = useCallback(async () => {
    try { 


      console.log('dispatch in');

      // dispatch(logoutUser());
      dispatch(logout());

      navigate('/home'); // Replace '/home' with the actual path to your login page
      // flash('Registeration successful', 'success')
      console.log('success');
      return

    } catch (error) {
      flash('Failed', 'error')
      console.error('Logout failed:', error);
    }
  
  }, [navigate, dispatch]);
  


  return (
    <div className="flex bg-muted/50 h-full w-full flex-col overflow-hidden rounded-xl border backdrop-blur-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center gap-2"> */}
            <div className="size-2 hidden sm:block rounded-full bg-green-500" />
            <span className="font-medium text-sm">FHIR Assistant</span>
             
          {/* </div> */}
          <div className="h-4 w-px bg-border" />
          {/* { user && (
          <> */}
          <UserIcon className='size-4 text-green-600'/>
          <span className='text-black text-xs sm:text-xl'> Hi {user?.username || 'Guest'}!</span>
          {/* </>
          )} */}
        </div>

        {/* Action Buttons Section */}

        <div className="flex items-center gap-3">
          { user?.email && (
            <>
                <a 
                  href='/home' className="hidden sm:inline-block bg-black shrink-0 rounded-md backdrop-blur-md hover:bg-[#60645381] text-white p-3 text-sm font-medium transition hover:text-black focus:outline-none hover:backdrop-blur-sm focus:ring active:text-black"
                  onClick={handleLogout}
                >
                  Logout
                </a>
  
            
            </>
          )}

          { !user?.email && (
            <>
              {/* DESKTOP/TABLET AUTH BUTTONS (Hidden on mobile) */}
              <div className="hidden md:flex items-center gap-3">
              {/* <div className="col-span-6 sm:flex sm:items-center sm:gap-4"> */}
                <a href="/login" className="bg-[#60645381] hover:bg-[#56574fc2] text-white px-4 py-2 text-sm font-medium rounded-md shadow transition">
                <button
                  className=""
                  type="submit" aria-disabled={loading}
                >
                </button>
                Sign in!</a>

              <p className="mt-4 text-sm text-gray-500 sm:mt-0">
                <a href="/register" className="text-gray-700 underline"> Sign up!</a>.
              </p>
              </div>
            </>
          )}

          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <RotateCcwIcon className="size-4 text-gray-600" />

          </Button>

          {/* MOBILE MENU TOGGLE (Hidden on desktop/tablet) */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden h-8 px-2 bg-gray-100 hover:bg-gray-200 rounded-md" 
            title="Toggle Menu"
          >
            <MenuIcon className={`size-4 ${isMobileMenuOpen ? 'text-green-600' : 'text-gray-600'}`} />
          </button>

          {/* MOBILE DROPDOWN MENU (Only visible when open and on mobile) */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-14 right-4 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-center p-3 border-b border-gray-100 bg-gray-50">
                {/* Mock Logo / User Icon for "fancy dropdown with logo" */}
                <UserIcon className="size-5 text-green-600 mr-2" />
                <span className="font-semibold text-sm text-gray-800">Account</span>
            </div>
            
            { user ? (
              <button
                onClick={handleLogout}
                className="w-full text-center px-4 py-3 text-sm text-red-600 font-medium hover:bg-red-50 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <a href="/login" className="block px-4 py-3 text-sm text-blue-600 font-medium hover:bg-gray-50 transition border-b">
                  Sign In!
                </a>
                <a href="/register" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition">
                  Sign up!
                </a>
              </>
            )}
          </div>
        )}

        </div>

      </div>
      {/* Conversation Area */}
      <Conversation className="flex-1">
        <ConversationContent className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">

              <Message from={msg.role}>
                <MessageContent>
                  {msg.isStreaming && msg.content === '' ? (
                    <div className="flex items-center gap-2">
                      <Loader size={14} />
                      <span className="text-muted-foreground text-sm">Thinking...</span>
                    </div>
                  ) : (
                    ''
                  )}
                
                  {/* <div className="h-[350px]"> */}
                    <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                      {msg.fhirResponse ? (
                        <FhirQueryVisualizer data={msg.fhirResponse} />
                      ) : (
                        <p className="p-2">{msg.content}</p>
                      )}
                    </div>
                  {/* </div> */}
                </MessageContent>
                <MessageAvatar 
                    src={msg.role === 'user' ? 'https://github.com/dovazencot.png' : 'https://github.com/vercel.png'} 
                    name={msg.role === 'user' ? 'User' : 'AI'} 
                  />
                
                
              </Message>

              {/* Reasoning */}
              {/* {msg.reasoning && (
                <div className="ml-10">
                  <Reasoning isStreaming={msg.isStreaming} defaultOpen={false}>
                    <ReasoningTrigger />
                    <ReasoningContent>{msg.reasoning}</ReasoningContent>
                  </Reasoning>
                </div>
              )} */}
              
              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="ml-10">
                  <Sources>
                    <SourcesTrigger count={msg.sources.length} />
                    <SourcesContent>
                      {msg.sources.map((source, index) => (
                        <Source key={index} href={source.url} title={source.title} />
                      ))}
                    </SourcesContent>
                  </Sources>
                </div>
              )}
            </div>
          ))}
          <ConversationScrollButton />
        </ ConversationContent>
      </Conversation>
      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="relative z-10 mx-4 -my-2 bg-white shadow rounded-md w-fit border border-gray-200">
          {suggestions.map((s) => (
            <div
              key={s}
              className="p-2 text-xs hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setInputValue(s);
                setSuggestions([]);
              }}
              >
              {s}
            </div>
          ))}
        </div>
      )}
      <div className="ml-10 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500" aria-disabled={loading}>

        {loading && <LoadingSpan /> }
      </div>
      {/* Input Area */}
      <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={inputValue}
            onChange={handleChange}
            placeholder="Ask me anything about e.g., “Show me all diabetic patients over 50"
            disabled={isTyping}
          />
          <PromptInputToolbar className='justify-end'>
            
            <PromptInputSubmit 
              disabled={!inputValue.trim() || isTyping}
              status={isTyping ? 'streaming' : 'ready'}
            />
          </PromptInputToolbar>
        
        </PromptInput>
      </div>
    </div>
  );
};

export default FhirBot;