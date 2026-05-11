import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { v1 as uuidv1 } from "uuid";
import API_BASE from "./config.js";

function ChatWindow() {
    const {
        prompt, setPrompt, setReply, currThreadId,
        setPrevChats, setNewChat, theme, toggleTheme,
        setAllThreads, setCurrThreadId,
        token, user, handleLogout, allThreads
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [toast, setToast] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const profileRef = useRef(null);

    // ─── Close dropdown on outside click ───
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // ─── Toast auto-dismiss ───
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // ─── Helper: get auth headers ───
    const getAuthHeaders = () => ({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    });

    // ─── Send message ───
    const getReply = async () => {
        if (!prompt.trim()) return;
        const sentPrompt = prompt.trim();
        setLoading(true);
        setNewChat(false);

        console.log("message ", sentPrompt, " threadId ", currThreadId);
        const options = {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ message: sentPrompt, threadId: currThreadId })
        };

        try {
            const response = await fetch(`${API_BASE}/api/chat`, options);
            const res = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleLogout();
                    return;
                }
                showToast(res.error || 'Failed to send message.', 'error');
                setLoading(false);
                return;
            }

            console.log(res);
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: sentPrompt
                }, {
                    role: "assistant",
                    content: res.reply
                }]
            ));
            setReply(res.reply);
            setPrompt("");
        } catch (err) {
            console.log(err);
            showToast('Failed to connect to server.', 'error');
        }
        setLoading(false);
    }

    // ─── Voice Toggle (OpenAI Whisper) ───
    const toggleVoice = async () => {
        if (isListening) {
            mediaRecorderRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');
                    
                    setLoading(true);
                    try {
                        const response = await fetch(`${API_BASE}/api/transcribe`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`
                            },
                            body: formData
                        });
                        const data = await response.json();
                        if (response.ok) {
                            setPrompt((prev) => prev + (prev ? " " : "") + data.text);
                        } else {
                            showToast(data.error || 'Transcription failed. (Note: OpenAI quota may be exceeded)', 'error');
                        }
                    } catch (err) {
                        console.error(err);
                        showToast('Error connecting to transcription service', 'error');
                    }
                    setLoading(false);
                    
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsListening(true);
            } catch (err) {
                console.error('Microphone access denied:', err);
                showToast('Microphone access denied or not supported.', 'error');
            }
        }
    };

    // ─── Dropdown Handlers ───
    const handleProfileClick = () => setIsOpen(!isOpen);

    const handleSettings = () => {
        setIsOpen(false);
        setSettingsOpen(true);
    };

    const handleUpgrade = () => {
        setIsOpen(false);
        showToast('✨ Premium features coming soon!', 'info');
    };

    const handleLogoutClick = () => {
        setIsOpen(false);
        if (confirm('Are you sure you want to log out?')) {
            handleLogout();
            showToast('Logged out successfully.', 'success');
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // ─── Clear all conversations ───
    const clearAllChats = async () => {
        if (!confirm('Delete ALL conversations? This cannot be undone.')) return;

        try {
            // Delete each thread from DB
            for (const thread of allThreads) {
                await fetch(`${API_BASE}/api/thread/${thread.threadId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
            }
        } catch (err) {
            console.log(err);
        }

        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setAllThreads([]);
        setSettingsOpen(false);
        showToast('All conversations cleared.', 'success');
    };

    // Get user initial for avatar
    const userInitial = user?.username ? user.username[0].toUpperCase() : 'U';

    return (
        <div className="chatWindow">
            {/* ─── Navbar ─── */}
            <div className="navbar">
                <span>SigmaGPT <i className="fa-solid fa-chevron-down"></i></span>

                <div className="navRight">
                    {/* Theme toggle */}
                    <button className="themeToggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
                    </button>

                    {/* Profile / Dropdown */}
                    <div className="profileArea" ref={profileRef}>
                        <div className="userIconDiv" onClick={handleProfileClick}>
                            <span className="userIcon">{userInitial}</span>
                        </div>

                        {isOpen && (
                            <div className="dropDown">
                                <div className="dropDownUserInfo">
                                    <span className="dropDownAvatar">{userInitial}</span>
                                    <div className="dropDownUserDetails">
                                        <span className="dropDownUsername">{user?.username}</span>
                                        <span className="dropDownEmail">{user?.email}</span>
                                    </div>
                                </div>
                                <div className="dropDownDivider"></div>
                                <div className="dropDownItem" onClick={handleSettings}>
                                    <i className="fa-solid fa-gear"></i> Settings
                                </div>
                                <div className="dropDownItem" onClick={handleUpgrade}>
                                    <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
                                </div>
                                <div className="dropDownDivider"></div>
                                <div className="dropDownItem danger" onClick={handleLogoutClick}>
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Settings Modal ─── */}
            {settingsOpen && (
                <div className="modalOverlay" onClick={() => setSettingsOpen(false)}>
                    <div className="settingsModal" onClick={(e) => e.stopPropagation()}>
                        <div className="settingsHeader">
                            <h2>Settings</h2>
                            <button className="closeBtn" onClick={() => setSettingsOpen(false)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="settingsSection">
                            <h3>Account</h3>
                            <div className="settingsRow">
                                <span>Username</span>
                                <span className="settingsValue">{user?.username}</span>
                            </div>
                            <div className="settingsRow">
                                <span>Email</span>
                                <span className="settingsValue">{user?.email}</span>
                            </div>
                        </div>

                        <div className="settingsSection">
                            <h3>Appearance</h3>
                            <div className="settingsRow">
                                <span>Dark Mode</span>
                                <label className="toggleSwitch">
                                    <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="settingsSection">
                            <h3>Data</h3>
                            <div className="settingsRow">
                                <span>Clear all conversations</span>
                                <button className="clearBtn" onClick={clearAllChats}>
                                    <i className="fa-solid fa-trash"></i> Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Chat Area ─── */}
            <Chat></Chat>

            <ScaleLoader color={theme === 'dark' ? '#fff' : '#2b7fd4'} loading={loading}>
            </ScaleLoader>

            {/* ─── Input Area ─── */}
            <div className="chatInputWrapper">
                <div className="chatInput">
                    <div className="inputBox">
                        <input placeholder="Type your message here..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' ? getReply() : ''}
                        />
                        <div className="inputBottomRow">
                            <div className="inputTools">
                                <button className="toolBtn" title="Attach file"><i className="fa-solid fa-paperclip"></i></button>
                                <button className="toolBtn" title="Use Image Lab"><i className="fa-solid fa-wand-magic-sparkles"></i></button>
                                <button className="toolBtn" title="Web Search"><i className="fa-solid fa-globe"></i></button>
                                <button 
                                    className={`toolBtn voiceBtn ${isListening ? 'listening' : ''}`}
                                    onClick={toggleVoice}
                                    title={isListening ? 'Stop listening' : 'Start voice input'}
                                >
                                    <i className={isListening ? 'fa-solid fa-stop' : 'fa-solid fa-microphone'}></i>
                                </button>
                            </div>
                            <div className="inputActions">
                                <span className="modelSelect">SigmaGPT-5.5 <i className="fa-solid fa-chevron-down"></i></span>
                                <div id="submit" onClick={getReply} className={prompt.trim() ? "active" : ""}><i className="fa-solid fa-paper-plane"></i></div>
                            </div>
                        </div>
                    </div>
                    <p className="info">
                        SigmaGPT can make mistakes. Check important info.
                    </p>
                </div>
            </div>

            {/* ─── Toast Notification ─── */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}

export default ChatWindow;
