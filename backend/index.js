const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const dbconfig = require("./config/dbConfig");

const server = require("./app");

const PORT = process.env.PORT_NUMBER || 1920;
const HOST = process.env.PORT_HOST || "localhost";

server.listen(PORT, HOST, () => {
  console.log(
    `Server is running: Listening to requests at http://${HOST}:${PORT}`
  );
});
