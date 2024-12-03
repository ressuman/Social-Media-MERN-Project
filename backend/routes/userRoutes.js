const express = require("express");

const {
  getNonFollowedUsers,
  getFriends,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  toggleFollow,
  toggleBookmark,
} = require("../controllers/userControllers");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Route for getting non-followed users
router.get("/find/non-followed", verifyToken, getNonFollowedUsers);

// Route to get all friends of the authenticated user
router.get("/find/friends", verifyToken, getFriends);

// Route to get details of a specific user by ID
router.get("/get-user/:userId", verifyToken, getUserById);

// Route to get all users
router.get("/find/get-all-users", getAllUsers);

// Route to update a user by ID
router.put("/update-user/:userId", verifyToken, updateUser);

// Route to delete a user by ID
router.delete("/delete-user/:userId", verifyToken, deleteUser);

// Route to toggle follow/unfollow
router.put("/toggle-follow/:otherUserId", verifyToken, toggleFollow);

// Route to bookmark/unbookmark a post
router.put("/bookmark/:postId", verifyToken, toggleBookmark);

module.exports = router;
