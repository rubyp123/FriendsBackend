// backend/src/models/calendar.js
import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    /** Local calendar date string: YYYY-MM-DD (use client tz when sending) */
    date: { type: String, required: true }, 
    title: { type: String, required: true },      // calendar name
    time: { type: String, default: "" },          // "HH:mm" (optional)
    color: { type: String, default: "#185c31ff" },  // Tailwind teal-500 by default
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

// One calendar per day per room (change to non-unique if you want multiple/day)
calendarSchema.index({ roomId: 1, date: 1 }, { unique: true });

// export const calendar = mongoose.model("calendar", calendarSchema);
export default mongoose.model("Calendar", calendarSchema);