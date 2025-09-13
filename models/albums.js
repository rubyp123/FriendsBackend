// backend/src/models/album.js
import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },

    text: { type: String, default: "" },  // caption/text
    mediaUrl: { type: String, required: true },  // Cloudinary URL
    publicId: { type: String, required: true },  // Cloudinary public ID (for deleting)

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// optional: index for fast queries by room
albumSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model("Album", albumSchema);
