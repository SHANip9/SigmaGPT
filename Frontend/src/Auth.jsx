import "./Auth.css";
import { useState } from "react";
import API_BASE from "./config.js";

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
        const body = isLogin
            ? { email, password }
            : { username, email, password };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong.");
                setLoading(false);
                return;
            }

            // Store token and user info
            localStorage.setItem("sigmagpt-token", data.token);
            localStorage.setItem("sigmagpt-user", JSON.stringify(data.user));

            onLogin(data.token, data.user);
        } catch (err) {
            setError("Unable to connect to server. Please try again.");
            console.log(err);
        }
        setLoading(false);
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setEmail("");
        setPassword("");
        setUsername("");
    };

    return (
        <div className="authContainer">
            {/* Animated background orbs */}
            <div className="authOrb authOrb1"></div>
            <div className="authOrb authOrb2"></div>
            <div className="authOrb authOrb3"></div>

            <div className="authCard">
                <div className="authLogo">
                    <span className="authLogoIcon">
                        <i className="fa-solid fa-bolt"></i>
                    </span>
                    <h1>SigmaGPT</h1>
                </div>

                <p className="authSubtitle">
                    {isLogin
                        ? "Welcome back! Sign in to continue."
                        : "Create your account to get started."
                    }
                </p>

                {error && (
                    <div className="authError">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="authForm">
                    {!isLogin && (
                        <div className="authField">
                            <label htmlFor="username">Username</label>
                            <div className="authInputWrapper">
                                <i className="fa-solid fa-user"></i>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    minLength={3}
                                    maxLength={30}
                                    autoComplete="username"
                                />
                            </div>
                        </div>
                    )}

                    <div className="authField">
                        <label htmlFor="email">Email</label>
                        <div className="authInputWrapper">
                            <i className="fa-solid fa-envelope"></i>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="authField">
                        <label htmlFor="password">Password</label>
                        <div className="authInputWrapper">
                            <i className="fa-solid fa-lock"></i>
                            <input
                                id="password"
                                type="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete={isLogin ? "current-password" : "new-password"}
                            />
                        </div>
                    </div>

                    <button type="submit" className="authSubmit" disabled={loading}>
                        {loading ? (
                            <span className="authSpinner"></span>
                        ) : (
                            <>
                                {isLogin ? "Sign In" : "Create Account"}
                                <i className="fa-solid fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                </form>

                <div className="authSwitch">
                    <span>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                    </span>
                    <button onClick={toggleMode} className="authSwitchBtn">
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;
