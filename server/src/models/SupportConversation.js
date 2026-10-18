const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["student", "assistant", "admin"],
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    clientMessageId: {
      type: String,
      required: true,
      maxlength: 100
    }
  },
  { timestamps: true }
);

const supportConversationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    ownerName: { type: String, required: true, trim: true, maxlength: 100 },
    ownerEmail: { type: String, required: true, trim: true, maxlength: 254 },
    question: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["waiting_for_support", "assigned", "live_chat", "resolved", "ended_by_student"],
      default: "waiting_for_support",
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    activeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true
    },
    requestIds: { type: [String], default: [] },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

supportConversationSchema.index({ status: 1, lastMessageAt: -1 });

module.exports = mongoose.model("SupportConversation", supportConversationSchema);
