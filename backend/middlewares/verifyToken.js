const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Access denied. No token provided." });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(400).json({
      success: false,
      error: "Invalid token format. Expected 'Bearer <token>'.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: "Invalid token." });
  }
};

module.exports = verifyToken;
