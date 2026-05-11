import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Auth from "./Auth.jsx";
import {MyContext} from "./MyContext.jsx";
import { useState, useEffect, useCallback } from 'react';
import {v1 as uuidv1} from "uuid";
import API_BASE from "./config.js";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); //stores all chats of curr threads
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  // ─── Auth State ───
  const [token, setToken] = useState(() => localStorage.getItem('sigmagpt-token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sigmagpt-user');
    return stored ? JSON.parse(stored) : null;
  });

  // Theme state — persisted to localStorage, dark by default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sigmagpt-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sigmagpt-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sigmagpt-token', newToken);
    localStorage.setItem('sigmagpt-user', JSON.stringify(newUser));
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sigmagpt-token');
    localStorage.removeItem('sigmagpt-user');
    // Clear chat state
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    setAllThreads([]);
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Invalid token");
      return res.json();
    })
    .then(userData => {
      setUser(userData);
      localStorage.setItem('sigmagpt-user', JSON.stringify(userData));
    })
    .catch(() => {
      handleLogout();
    });
  }, [token, handleLogout]);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    theme, toggleTheme,
    token, user, handleLogout
  }; 

  // If not authenticated, show login page
  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
          <Sidebar></Sidebar>
          <ChatWindow></ChatWindow>
        </MyContext.Provider>
    </div>
  )
}

export default App
