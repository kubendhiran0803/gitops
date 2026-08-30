const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000;

const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "appdb"
};

async function initializeDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    console.log("Connected to MySQL");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(255) NOT NULL
      )
    `);

    console.log("messages table is ready");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

app.get("/", async (req, res) => {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM messages"
    );

    res.json({
      application: "GitOps Demo Application",
      status: "running",
      mysql: "connected",
      message_count: rows[0].count
    });
  } catch (error) {
    console.error("Database query failed:", error.message);

    res.status(500).json({
      application: "GitOps Demo Application",
      mysql: "connection failed",
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(port, async () => {
  console.log(`Application listening on port ${port}`);

  await initializeDatabase();
});
