// server/src/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.senderId = ret.sender?.toString();
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Fast cursor pagination by room + _id
messageSchema.index({ roomId: 1, _id: -1 });

// export const Message = mongoose.model("Message", messageSchema);
export default mongoose.model("Message", messageSchema);