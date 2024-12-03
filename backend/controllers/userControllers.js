const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * Get Non-Followed Users
 * @route GET /api/v1/user/find/non-followed
 * @access Private
 */

exports.getNonFollowedUsers = async (req, res) => {
  try {
    // Ensure `req.user` is populated (e.g., through middleware)
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized access" });
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, error: "Current user not found" });
    }

    const allUsers = await User.find({}).select("-password");

    // Filter out users the current user is already following and themselves
    let nonFollowedUsers = allUsers.filter((user) => {
      return (
        !currentUser.followings.includes(user._id.toString()) &&
        user._id.toString() !== currentUser._id.toString()
      );
    });

    // Limit to 5 suggestions
    if (nonFollowedUsers.length > 5) {
      nonFollowedUsers = nonFollowedUsers.slice(0, 5);
    }

    return res.status(200).json({
      success: true,
      message: "Non-followed users fetched successfully",
      count: nonFollowedUsers.length,
      data: nonFollowedUsers,
    });
  } catch (error) {
    console.error("Error in getNonFollowedUsers:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get Friends of the Current User
 * @route GET /api/v1/user/find/friends
 * @access Private
 */
exports.getFriends = async (req, res) => {
  try {
    // Check if the authenticated user ID is available
    if (!req.user || !req.user.id) {
      console.error(
        "Unauthorized access: Missing or invalid user ID in request."
      );
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized access. Please log in." });
    }

    // Find the current user in the database
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      console.error(`User not found: ID ${req.user.id}`);
      return res
        .status(404)
        .json({ success: false, error: "Current user not found." });
    }

    console.log("Fetching friends for user:", currentUser.username);
    console.log("Followings list:", currentUser.followings);

    // Retrieve friends using the followings array
    const friends = await Promise.all(
      currentUser.followings.map(async (friendId) => {
        try {
          const friend = await User.findById(friendId).select("-password");
          if (!friend) {
            console.warn(`Friend not found: ID ${friendId}`);
          }
          return friend;
        } catch (err) {
          console.error(
            `Error fetching friend with ID ${friendId}:`,
            err.message
          );
          return null; // Handle missing or invalid friends gracefully
        }
      })
    );

    // Filter out null values (e.g., friends not found)
    const validFriends = friends.filter((friend) => friend);

    console.log("Valid friends list:", validFriends);

    // Respond with the list of friends
    return res.status(200).json({
      success: true,
      message: "Friends fetched successfully",
      count: validFriends.length,
      friends: validFriends,
    });
  } catch (error) {
    console.error("Error in getFriends function:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while fetching friends.",
    });
  }
};

/**
 * Get a Single User by ID
 * @route GET /api/v1/user/get-user/:userId
 * @access Private
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId parameter
    if (!userId || userId.length !== 24) {
      // MongoDB ObjectIDs are 24 characters
      console.error("Invalid user ID provided:", userId);
      return res
        .status(400)
        .json({ success: false, error: "Invalid user ID format." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ID ${userId}`);
      return res
        .status(404)
        .json({ success: false, error: "No such user. Invalid ID!" });
    }

    console.log(`User fetched successfully: ${user.username}`);

    // Exclude sensitive information like password before sending the response
    const { password, ...others } = user._doc;

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: others,
    });
  } catch (error) {
    console.error("Error in getUserById function:", error);
    return res
      .status(500)
      .json({ error: "An unexpected error occurred while fetching the user." });
  }
};

/**
 * Get All Users
 * @route GET /api/v1/user/find/get-all-users
 * @access Public
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({});
    if (users.length === 0) {
      console.warn("No users found in the database.");
      return res.status(404).json({ success: false, error: "No users found." });
    }

    // Format user data to exclude sensitive fields
    const formattedUsers = users.map((user) => ({
      username: user.username,
      email: user.email,
      _id: user._id,
      createdAt: user.createdAt,
    }));

    console.log("Formatted user list:", formattedUsers);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while fetching users.",
    });
  }
};

/**
 * Update User
 * @route PUT /api/v1/user/update-user/:userId
 * @access Private
 */
exports.updateUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the user is authorized to update their profile
    if (userId.toString() !== req.user.id.toString()) {
      console.warn(`Unauthorized update attempt by user: ${req.user.id}`);
      return res.status(403).json({
        success: false,
        error: "You can update only your own profile!",
      });
    }

    // Hash the password if it exists in the request body
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
      console.log("Password has been hashed.");
    }

    // Update the user document in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true } // Return the updated document
    );

    console.log("User updated successfully:", updatedUser);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while updating the user.",
    });
  }
};

/**
 * Delete User
 * @route DELETE /api/v1/user/delete-user/:userId
 * @access Private
 */
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the user is authorized to delete their profile
    if (userId !== req.user.id) {
      console.warn(`Unauthorized delete attempt by user: ${req.user.id}`);
      return res.status(403).json({
        success: false,
        error: "You can delete only your own profile!",
      });
    }

    // Delete the user document from the database
    await User.findByIdAndDelete(req.user.id);

    console.log(`User deleted successfully: ID ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: "Successfully deleted user.",
      data: {},
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while deleting the user.",
    });
  }
};

/**
 * Toggle Follow/Unfollow a User
 * @route PUT /api/v1/user/toggle-follow/:otherUserId
 * @access Private
 */
exports.toggleFollow = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.otherUserId;

    // Prevent users from following themselves
    if (currentUserId === otherUserId) {
      return res
        .status(400)
        .json({ success: false, error: "You can't follow yourself." });
    }

    // Fetch current and target users
    const currentUser = await User.findById(currentUserId);
    const otherUser = await User.findById(otherUserId);

    if (!currentUser || !otherUser) {
      return res
        .status(404)
        .json({ success: false, error: "User(s) not found." });
    }

    console.log(
      `Current user ID: ${currentUserId}, Target user ID: ${otherUserId}`
    );

    // Follow or unfollow logic
    if (!currentUser.followings.includes(otherUserId)) {
      // Follow the user
      currentUser.followings.push(otherUserId);
      otherUser.followers.push(currentUserId);

      console.log(`User ${currentUserId} followed user ${otherUserId}`);
      await currentUser.save();
      await otherUser.save();

      return res.status(200).json({
        success: true,
        message: `You have successfully followed ${otherUser.username} with userId ${otherUserId}. You are now friends with ${otherUser.username}. You now have ${otherUser.followers.length} follower(s).`,
      });
    } else {
      // Unfollow the user
      currentUser.followings = currentUser.followings.filter(
        (id) => id !== otherUserId
      );
      otherUser.followers = otherUser.followers.filter(
        (id) => id !== currentUserId
      );

      console.log(`User ${currentUserId} unfollowed user ${otherUserId}`);
      await currentUser.save();
      await otherUser.save();

      return res.status(200).json({
        success: true,
        message: `You have successfully unfollowed ${otherUser.username} with userId ${otherUserId}. You are no longer friends with ${otherUser.username}.You now have ${otherUser.followers.length} follower(s).`,
      });
    }
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Bookmark or Unbookmark a Post
 * @route PUT /api/v1/user/bookmark/:postId
 * @access Private
 */
exports.toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // Fetch the post and user
    const post = await Post.findById(postId).populate("user", "-password");
    const user = await User.findById(userId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    console.log(`Post ID: ${postId}, User ID: ${userId}`);

    // Check if the post is already bookmarked
    const isBookmarked = user.bookmarkedPosts.includes(postId);

    if (isBookmarked) {
      // Unbookmark the post
      user.bookmarkedPosts = user.bookmarkedPosts.filter((id) => id !== postId);

      console.log(`Post ${postId} unbookmarked by user ${userId}`);
      await user.save();

      return res.status(200).json({
        success: true,
        message: `Successfully unbookmarked the post by user ${userId} with name ${user.username} and email ${user.email} from postId ${postId}.`,
        data: `Post ${postId} unbookmarked by user ${userId} with name ${user.username} and email ${user.email}.`,
      });
    } else {
      // Bookmark the post
      user.bookmarkedPosts.push(postId);

      console.log(`Post ${postId} bookmarked by user ${userId}`);
      await user.save();

      return res.status(200).json({
        success: true,
        message: `Successfully bookmarked the post by user ${userId} with name ${user.username} and email ${user.email} from postId ${postId}.`,
        data: `Post ${postId} bookmarked by user ${userId} with name ${user.username} and email ${user.email}.`,
      });
    }
  } catch (error) {
    console.error("Error in toggleBookmark:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
