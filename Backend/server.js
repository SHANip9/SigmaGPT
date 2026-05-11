import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

const corsOrigin = process.env.FRONTEND_URL || "*";

app.use(express.json());
app.use(cors({
    origin: corsOrigin,
    credentials: corsOrigin !== "*"
}));

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

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return;

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err.message);
        throw err;
    }
};

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

if (!process.env.VERCEL) {
    startServer().catch(() => process.exit(1));
}

export const handler = async (req, res) => {
    await connectDB();
    return app(req, res);
};

export default app;
