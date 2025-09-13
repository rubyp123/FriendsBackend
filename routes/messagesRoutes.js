// backend/routes/messages.js
import express from "express";
import mongoose from "mongoose";
import Message  from "../models/Message.js";      // ensure these files exist
import Room from "../models/Rooms.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/messages?roomId=ROOM123&limit=30&cursor=<messageId>
 * - roomId: required
 * - limit: page size (max 100)
 * - cursor: return messages with _id < cursor (older)
 * Returns: { messages: [...ascending], nextCursor, hasMore }
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.query;
    if (!roomId) return res.status(400).json({ message: "roomId is required" });

    const limit = Math.min(parseInt(req.query.limit || "30", 10), 100);
    const cursor = req.query.cursor ? new mongoose.Types.ObjectId(req.query.cursor) : null;

    // Optional membership enforcement (comment out if not using members)
    const room = await Room.findOne({ roomId }).lean();
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: "Not a member of room" });
    }

    const filter = { roomId };
    if (cursor) filter._id = { $lt: cursor };

    const docsDesc = await Message.find(filter).sort({ _id: -1 }).limit(limit).lean();
    const nextCursor = docsDesc.length === limit ? docsDesc[docsDesc.length - 1]._id : null;

    res.json({
      messages: docsDesc.reverse(), // ascending for UI
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
});

export default router;
