import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";  // later when you add rooms
import messagesRoutes from "./routes/messagesRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import albumRoutes from "./routes/albumRoutes.js"

import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { initChatSocket } from "./socket/socketIndex.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// DB connection
mongoose.connect("mongodb://127.0.0.1:27017/ClientData")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("DB error:", err));

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms" , roomRoutes);
app.use("/api/messages", messagesRoutes); 
app.use("/api/calendar" , calendarRoutes);
app.use("/api/albums", albumRoutes);


app.get("/health", (_req, res) => res.send("OK"));

const httpServer = createServer(app);
initChatSocket(httpServer, "http://localhost:5173");

//  Start server
httpServer.listen(5000, () => console.log("Server running on port 5000"));
