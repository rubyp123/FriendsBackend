import { Router } from "express";
import  Calendar  from "../models/Calendar.js";
import  Room  from "../models/Rooms.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router = Router();
// GET /api/calendar/:roomId/:monthDate   where monthDate is YYYY-MM
router.get("/:roomId/:monthDate", authMiddleware, async (req, res) => {
  try {
    const { roomId, monthDate } = req.params; // <-- params, not query
  
    // Validate monthDate format YYYY-MM

    if (!roomId || !monthDate) {
      return res
        .status(400)
        .json({ message: "roomId and monthDate (YYYY-MM) are required" });
    }

    const room = await Room.findOne({ roomId }).lean();
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!room.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: "Not a member of room" });
    }

    // Dates are stored as "YYYY-MM-DD" strings:
    const regex = new RegExp(`^${monthDate}-\\d{2}$`);

    const docs = await Calendar.find({
      roomId,
      date: { $regex: regex },
    }).lean();

    res.json({ occasions: docs });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to load occasions", error: err.message });
  }
});



router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { roomId, date, title, time, color } = req.body || {};
    if (!roomId || !date || !title) {
      return res.status(400).json({ message: "roomId, date, title are required" });
    }

    const room = await Room.findOne({ roomId }).lean();
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: "Not a member of room" });
    }

    const update = {
      title: title.trim(),
      time: (time || "").trim(),
      color: color || "#22c55e",
      // only set on insert:
      $setOnInsert: {
        createdBy: req.user.id,
        createdByName: req.user.name,
        roomId,
        date,
      },
    };

    const doc = await Calendar.findOneAndUpdate(
      { roomId, date },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const io = req.app.get("io"); // set in server bootstrap
    if (io) {
      io.to(roomId).emit("calendar:upsert", doc.toJSON());
    }

    res.json({ occasion: doc.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Failed to save occasion", error: err.message });
  }
});

/**
 * DELETE /api/occasions
 * Body: { roomId, date: 'YYYY-MM-DD' }
 */
router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const { roomId, date } = req.body || {};
    if (!roomId || !date) return res.status(400).json({ message: "roomId and date are required" });

    const room = await Room.findOne({ roomId }).lean();
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: "Not a member of room" });
    }

    const occasion = await Calendar.findOne({ roomId, date });
    if (!occasion) return res.status(404).json({ message: "Occasion not found" });
 
    if (String(occasion.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the creator can delete this occasion" });
    }

    const removed = await Calendar.findOneAndDelete({ roomId, date });
    const io = req.app.get("io");
    if (removed && io) {
      io.to(roomId).emit("calendar:remove", { roomId, date });
    }

    res.json({ removed: !!removed });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete occasion", error: err.message });
  }
});

export default router;