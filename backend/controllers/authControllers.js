const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check for required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required.",
        success: false,
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long.",
        success: false,
      });
    }

    // Check if the user already exists
    const isExisting = await User.findOne({ email });
    if (isExisting) {
      return res
        .status(409)
        .json({ error: "Email is already registered.", success: false });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user
    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = newUser._doc;

    return res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
      token,
      success: true,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred.", success: false });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required.", success: false });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid credentials.", success: false });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Invalid credentials.", success: false });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user._doc;

    return res.status(200).json({
      message: "Login successful.",
      user: userWithoutPassword,
      token,
      success: true,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred.", success: false });
  }
};
