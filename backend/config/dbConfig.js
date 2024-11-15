const mongoose = require("mongoose");

// Connection logic
mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING_URL);

// Connection state
const db = mongoose.connection;

// Check DB Connection
db.on("connected", () => {
  console.log("DB Connection Successful!");
});

db.on("error", (err) => {
  console.log("DB Connection failed!", err);
});

db.on("disconnected", () => {
  console.log("DB Connection disconnected!");
});

// Gracefully close the connection when the app is closed
process.on("SIGINT", () => {
  db.close(() => {
    console.log("DB Connection closed due to application termination.");
    process.exit(0);
  });
});

module.exports = db;
