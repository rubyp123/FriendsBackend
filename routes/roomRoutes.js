import express from "express";
import { v4 as uuidv4 } from "uuid";
import Room from "../models/Rooms.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Room
router.post("/create" , authMiddleware , async(req , res) => {
    try{
        const {name} = req.body;
        if (!name) return res.status(400).json({ message: "Room name is required" });

        const roomId = uuidv4();
        const newRoom = await Room.create({
            roomId,
            name,
            owner : req.user.id,
            members : [req.user.id]
        });

        const roomLink = `http://localhost:5173/room/${roomId}`;
        return res.json({success : true , roomLink , room:newRoom});
    }
    catch (err) {
        return res.status(500).json({error:err.message});
    }
});

// Join Room
router.post("/join/:roomId" , authMiddleware , async (req , res) => {
    try{
        const { roomId} = req.params;
        const room = await Room.findOne({roomId});

        if (!room) return res.status(404).json({ message: "Room not found" });
        
        if(!room.members.includes(req.user.id)){
            room.members.push(req.user.id);
            await room.save();
        }
        res.json({
            success: true,
            message: `Joined room "${room.name}" successfully`,
            room: {
                roomId: room.roomId,
                name: room.name,
                members: room.members,
                owner: room.owner,
                membersCount: room.members.length
            },
        });
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});

// Ftech All rooms, when change in room list.

router.get("/my-rooms", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id });
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  Get room details by roomId
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId })
    .populate({ path: "members", select: "name email" }) // 🔑 include BOTH
    .lean();

    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json(room);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a room (only owner can delete)
router.delete("/delete/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(roomId);
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // check if logged in user is the owner
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the owner can delete this room" });
    }

    await Room.deleteOne({ roomId });

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default router