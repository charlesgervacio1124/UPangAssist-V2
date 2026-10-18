const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false
    },
    course: {
      type: String,
      default: "",
      trim: true
    },
    accountType: {
      type: String,
      enum: ["student", "employee", "admin"],
      default: "student",
      required: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);