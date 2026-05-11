// API base URL — uses Vite env var in production, falls back to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default API_BASE;
