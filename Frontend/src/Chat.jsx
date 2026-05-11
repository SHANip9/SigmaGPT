import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, reply, setPrompt } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);

    useEffect(() => {   
        if (reply === null) {
            setLatestReply(null); //prevchat load
            return;
        }

        if (!prevChats?.length) return; //if prev chat doesn't exist

        const content = reply.split(" "); //individual words

        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));

            idx++;
            if (idx >= content.length) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);

    }, [prevChats, reply])

    return (
        <>
            {newChat && (
                <div className="emptyState">
                    <h1 className="welcomeTitle">Hello! How can I assist you today?</h1>
                    
                    <div className="suggestionPills">
                        <button className="pill"><i className="fa-solid fa-gem"></i> Popular</button>
                        <button className="pill"><i className="fa-regular fa-heart"></i> Motivation & Support</button>
                        <button className="pill"><i className="fa-solid fa-pen-nib"></i> Writing & Editing</button>
                        <button className="pill"><i className="fa-solid fa-ellipsis"></i> More</button>
                    </div>

                    <div className="featureCards">
                        <div className="featureCard" onClick={() => setPrompt("Can you help me master document creation?")}>
                            <div className="cardIcon green"><i className="fa-solid fa-file-lines"></i></div>
                            <div className="cardText">
                                <h3>Doc Master</h3>
                                <p>Work with text files</p>
                            </div>
                        </div>
                        <div className="featureCard" onClick={() => setPrompt("How do I upload an image for you to analyze?")}>
                            <div className="cardIcon orange"><i className="fa-solid fa-cloud-arrow-up"></i></div>
                            <div className="cardText">
                                <h3>Image Upload</h3>
                                <p>Ask with pics</p>
                            </div>
                        </div>
                        <div className="featureCard" onClick={() => setPrompt("Please transform this picture for me.")}>
                            <div className="cardIcon blue"><i className="fa-regular fa-image"></i></div>
                            <div className="cardText">
                                <h3>Pic Transformer</h3>
                                <p>Apply styles to photos</p>
                            </div>
                        </div>
                        <div className="featureCard" onClick={() => setPrompt("Can you animate these images into a video?")}>
                            <div className="cardIcon red"><i className="fa-solid fa-video"></i></div>
                            <div className="cardText">
                                <h3>Photo to Video</h3>
                                <p>Animate your images</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className={`chats ${newChat ? 'hidden' : ''}`}>
                {
                    prevChats?.slice(0, -1).map((chat, idx) =>
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {
                                chat.role === "user" ?
                                    <p className="userMessage">{chat.content}</p> :
                                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{chat.content}</ReactMarkdown>
                            }
                        </div>
                    )
                }

                {
                    //latest reply  from the chat
                    prevChats?.length > 0 && (
                        <>
                            {
                                latestReply === null ? (
                                    <div className="gptDiv" key={"non-typing"} >
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{prevChats[prevChats.length - 1].content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="gptDiv" key={"typing"} >
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{latestReply}</ReactMarkdown>
                                    </div>
                                )

                            }
                        </>
                    )
                }

            </div>
        </>
    )
}

export default Chat;
