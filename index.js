import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messagesRoutes from "./routes/messagesRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { initChatSocket } from "./socket/socketIndex.js";

const app = express();
app.use(express.json());

//  Allow correct frontend depending on environment
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL, //  dynamic frontend URL
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

//  Database connection (Atlas)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Atlas connected"))
  .catch((err) => console.error(" DB connection error:", err));

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/albums", albumRoutes);

//  Health check for Render uptime monitoring
app.get("/health", (_req, res) => res.send("OK"));

//  Socket.IO setup
const httpServer = createServer(app);
initChatSocket(httpServer, FRONTEND_URL);

//  Dynamic port for Render
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(` Server running on port ${PORT}`)
);
