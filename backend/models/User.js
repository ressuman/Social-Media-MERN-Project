const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      trim: true,
    },
    profileImg: {
      type: String,
      default: "",
    },
    followings: {
      type: [String],
      default: [],
    },
    followers: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    bookmarkedPosts: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
