import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ───
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));

// ─── Health Check (no auth required) ───
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "SigmaGPT API is running" });
});

app.get("/api/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
    res.json({
        status: "ok",
        database: states[dbState] || "unknown",
        timestamp: new Date().toISOString()
    });
});

// ─── Routes ───
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// ─── Connect to MongoDB, then start server ───
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB!");
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB:", err.message);
        process.exit(1);
    }
};

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});

export default app;
