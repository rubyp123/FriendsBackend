// backend/routes/albums.js
import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import Album from "../models/albums.js";
import { v2 as cloudinary } from "cloudinary";
import  authMiddleware  from "../middleware/authMiddleware.js";  // ✅


import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Upload new post
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { roomId, text } = req.body;

    const album = new Album({
      roomId,
      text,
      mediaUrl: req.file.path,     // Cloudinary URL
      publicId: req.file.filename, // Cloudinary public ID
      createdBy: req.user.id,      // from JWT
      createdByName: req.user.name,
    });

    await album.save();
    res.json({ success: true, album });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});




router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const albums = await Album.find({ roomId: req.params.roomId }).lean()
    if (!albums) return res.status(404).json({ message: "Room not found" });
    return res.json({ success: true, albums });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Delete post
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Post not found" });

    //  only uploader can delete
    if (album.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own post" });
    }
    let resourceType = "image";
    if (album.mediaUrl.match(/\.mp4$/)) {
      resourceType = "video";
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(album.publicId, { resource_type: resourceType });

    // Delete from DB
    await album.deleteOne();

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});





export default router;
