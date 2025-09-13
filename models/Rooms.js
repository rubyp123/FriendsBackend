import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true }, // ✅ new field
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Client" }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Room", RoomSchema);
