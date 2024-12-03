const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
//const swaggerJsDoc = require("swagger-jsdoc");
//const swaggerUi = require("swagger-ui-express");

const dotenv = require("dotenv");

dotenv.config();

const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui.min.css";

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

// Database Connection
mongoose
  .connect(process.env.MONGO_DB_CONNECTION_STRING_URL)
  .then(() => {
    console.log("Connected to MongoDB Database");
  })
  .catch((err) => {
    console.error("Initial MongoDB connection error:", err.message);
  });

// Connection state
const db = mongoose.connection;

// Check DB Connection
db.on("connected", () => {
  console.log("DB Connection Successful!");
});

db.on("error", (err) => {
  console.log("DB Connection failed!", err.message);
});

db.on("disconnected", () => {
  console.log("DB Connection disconnected!");
});

// Gracefully close the connection when the app is closed
process.on("SIGINT", async () => {
  try {
    await db.close();
    console.log("DB Connection closed due to application termination.");
    process.exit(0);
  } catch (err) {
    console.error("Error closing DB connection:", err.message);
    process.exit(1);
  }
});

const PORT = process.env.PORT_NUMBER || 1920;
const HOST = process.env.PORT_HOST || "localhost";

const app = express();

// Middlewares
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Welcome message of the application
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Social Media Echosphere Loop API",
    description:
      "The Echosphere Loop API is a robust and scalable RESTful interface powering a next-generation social media platform. Designed for seamless user engagement, it offers endpoints for real-time messaging, user profile management, multimedia sharing, and notification systems. With a focus on performance and reliability, this API supports dynamic interactions, making social connections more engaging and interactive.",
    version: "1.0.0",
    status:
      "Server is operational and running smoothly, ready to handle requests.",
    documentation:
      "Visit /api-docs for detailed API usage guidelines, endpoint specifications, and example requests.",
  });
});

// Swagger API Documentation
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerDocs, {
//     customCss:
//       ".swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }",
//     customCssUrl: CSS_URL,
//   })
// );

// Routes Handlers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);

app.listen(PORT, HOST, () => {
  console.log(
    `Server is running: Listening to requests at http://${HOST}:${PORT}`
  );
});

// Error handler for unsupported routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
