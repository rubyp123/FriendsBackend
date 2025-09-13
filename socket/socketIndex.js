// server/src/socket/index.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import  Message  from "../models/Message.js"; // <-- named import

function getUserFromSocket(socket) {
  const hdr = socket.handshake.headers?.authorization || "";
  const tokenFromHeader = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  const tokenFromAuth = socket.handshake.auth?.token;
  const token = tokenFromHeader || tokenFromAuth;
  if (!token) throw new Error("No token provided");
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return { id: payload.id, name: payload.name };
}

export function initChatSocket(httpServer, origin) {
  const io = new Server(httpServer, {
    cors: { origin, credentials: true },
    transports: ["websocket", "polling"],
  });

  // Auth guard
  io.use((socket, next) => {
    try {
      socket.user = getUserFromSocket(socket);
      next();
    } catch (e) {
      console.error("Socket auth failed:", e.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(" Socket connected:", socket.id);
    const { id: userId, name } = socket.user;

    /** ---------- Chat ---------- **/
    socket.on("join_room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.to(roomId).emit("user_joined", { userId, name, roomId, at: Date.now() });
    });

    socket.on("send_message", async ({ roomId, text, tempId }) => {
      try {
        if (!roomId || !text?.trim()) return;

        const msg = await Message.create({
          roomId,
          sender: userId,
          senderName: name,
          text: text.trim(),
        });

        const payload = msg.toJSON();
        if (tempId) socket.emit("message_saved", { tempId, _id: payload._id });
        io.to(roomId).emit("new_message", payload);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("message_error", { roomId, error: err.message });
      }
    });

    socket.on("typing", ({ roomId, isTyping }) => {
      if (!roomId) return;
      socket.to(roomId).emit("typing", { roomId, userId, name, isTyping: !!isTyping });
    });

    socket.on("leave_room", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      socket.to(roomId).emit("user_left", { userId, name, roomId, at: Date.now() });
    });

    /** ---------- WebRTC signaling ---------- **/
    socket.on("webrtc:join", ({ roomId }) => {
      if (!roomId) return;
      const rtcRoom = `rtc:${roomId}`;
      socket.join(rtcRoom);
      socket.to(rtcRoom).emit("webrtc:ready", { userId, name });
    });

    socket.on("webrtc:leave", ({ roomId }) => {
      if (!roomId) return;
      const rtcRoom = `rtc:${roomId}`;
      socket.leave(rtcRoom);
      socket.to(rtcRoom).emit("webrtc:peer-left", { userId });
    });

    socket.on("webrtc:offer", ({ roomId, sdp }) => {
      if (!roomId || !sdp) return;
      socket.to(`rtc:${roomId}`).emit("webrtc:offer", { from: userId, sdp });
    });

    socket.on("webrtc:answer", ({ roomId, sdp }) => {
      if (!roomId || !sdp) return;
      socket.to(`rtc:${roomId}`).emit("webrtc:answer", { from: userId, sdp });
    });

    socket.on("webrtc:ice-candidate", ({ roomId, candidate }) => {
      if (!roomId || !candidate) return;
      socket.to(`rtc:${roomId}`).emit("webrtc:ice-candidate", { from: userId, candidate });
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, "reason:", reason);
    });
  });

  return io;
}
