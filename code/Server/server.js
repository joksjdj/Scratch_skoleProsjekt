const mysql = require("mysql2/promise");
const crypto = require("crypto");

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();
const cookieParser = require("cookie-parser");
const e = require("express");
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

async function connectToDatabase() {
  const connection =  await mysql.createConnection({
    host: 'localhost',
    user: 'test',       // your MySQL username
    password: 'test123', // your MySQL password
    database: 'scratch'    // your database name
  });

  return connection;
}

app.use(
  session({
    secret: 'yourSecretKey', // Replace with a unique key
    resave: false,           // Avoid resaving unchanged sessions
    saveUninitialized: false, // Only save sessions with initialized data
    cookie: {
      maxAge: 60000,         // 1-minute session expiry
      sameSite: 'lax', // <- important for cross-origin
      secure: false, 
    },
  })
);

app.get('/login', async (req, res) => {
  console.log('\n\n')
  console.log(req.query);

  const username = req.query.username;
  const password = req.query.password;

  if (!req.session.userKey) {
    req.session.userKey = crypto.randomBytes(64).toString("hex");

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
      console.log("Connected!");
    });

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      res.json({ success: false, message: "Invalid credentials" });
      return;
    }

    await db.execute(
      `INSERT IGNORE INTO tokens (user_id, token) VALUES (?, ?)`,
      [rows[0].id, req.session.userKey]
    );

    db.end();
  } else {
    console.log("Existing session:", req.session.userKey);
  }

  if (!req.session.visits) req.session.visits = 0;
  req.session.visits++;

  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  console.log('Visits:', req.session.visits);
  console.log('\n\n')

  res.json({ success: true, message: "Logged in successfully" });
});


app.get('/token', async (req, res) => {
  console.log('\n\n')

  const userKey = req.session.userKey;

  const requestedTable = req.query.table;
  const requestedColumn = req.query.collumn;
  console.log(userKey, requestedTable, requestedColumn);

  const db = await connectToDatabase();

  await db.connect(err => {
    if (err) throw err;
  });

  const [rows] = await db.execute(
    'SELECT * FROM tokens WHERE token = ?',
    [userKey]
  );

  if (rows.length === 0) {
    res.json({ success: false, message: "Invalid token" });
    return;
  } else {
    console.log('Valid token for user ID:', rows[0].user_id);
  }

  const [infoRows] = await db.execute(
    `SELECT ${requestedColumn} FROM ${requestedTable} WHERE id = ?`,
    [rows[0].user_id]
  );

  res.json({ success: true, info: infoRows[0]});
  db.end();
  console.log('\n\n');
});


app.listen(4000, () => console.log('Server running on http://localhost:4000'));