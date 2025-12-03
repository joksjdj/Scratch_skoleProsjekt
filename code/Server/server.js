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
  try {
    const connection =  await mysql.createConnection({
      host: 'localhost',
      user: 'test',       // your MySQL username
      password: 'test123', // your MySQL password
      database: 'scratch'    // your database name
    });

    return connection;
  } catch (err) {
    console.error(`[connectToDatabase] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    throw err;
  }
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
  try {
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
  } catch (err) {
    console.error(`[/login] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});


app.get('/token', async (req, res) => {
  try {
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

    const id = requestedTable === 'users' ? "id": "user_id";
    const [infoRows] = await db.execute(
      `SELECT ${requestedColumn} FROM ${requestedTable} WHERE ${id} = ?`,
      [rows[0].user_id]
    );

    res.json({ success: true, info: infoRows});
    db.end();
    console.log('\n\n');
  } catch (err) {
    console.error(`[/token] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});

async function checkToken(key) {
  const userKey = key;
  console.log(userKey);

  const db = await connectToDatabase();

  await db.connect(err => {
    if (err) throw err;
  });

  const [rows] = await db.execute(
    'SELECT * FROM tokens WHERE token = ?',
    [userKey]
  );

  db.end();

  if (rows.length === 0) {
    return false;
  } else {
    console.log('Valid token for user ID:', rows[0].user_id);
    return rows[0].user_id;
  }
}

app.get('/profile', async (req, res) => {
  try {
    console.log('\n\n')

    const userKey = req.session.userKey;

    const userId = await checkToken(userKey);
    if (!userId) {
      res.json({ success: false, message: "Invalid token" });
      return;
    }

    const requestedTable = req.query.table;
    const requestedColumn = req.query.collumn;
    console.log(requestedTable, requestedColumn);

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
    });

    const id = requestedTable === 'users' ? "id": "user_id";
    const [infoRows] = await db.execute(
      `SELECT ${requestedColumn} FROM ${requestedTable} WHERE ${id} = ?`,
      [userId]
    );

    res.json({ success: true, info: infoRows});
    db.end();
    console.log('\n\n');
  } catch (err) {
    console.error(`[/token] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});

app.get('/createProject', async (req, res) => {
  try {
    console.log('\n\n')

    const userKey = req.session.userKey;
    const projectName = req.query.name;

    console.log(userKey, projectName);

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
    });

    const [rows] = await db.execute(
      'SELECT user_id FROM tokens WHERE token = ?',
      [userKey]
    );

    if (rows.length === 0) {
      res.json({ success: false, message: "Invalid token" });
      return;
    }

    const [projectAdded] = await db.execute(
      `INSERT IGNORE INTO written_code (user_id, name) VALUES (?, ?)`,
      [rows[0].user_id, projectName]
    );

    db.end();

    console.log(projectAdded)
    if (projectAdded.affectedRows === 0) {
      res.json({ success: false, message: "Project with this name already exists"});
      return;
    }

    res.json({ success: true, message: "Project created successfully"});
  } catch (err) {
    console.error(`[/createProject] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});

app.get('/fetchCode', async (req, res) => {
  try {
    console.log('\n\n')

    const userKey = req.session.userKey;
    const projectName = req.query.name;
    const userId = req.query.userId;

    console.log(userKey, projectName, userId);

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
    });

    const [rows] = await db.execute(
      'SELECT user_id FROM tokens WHERE token = ?',
      [userKey]
    );

    if (rows.length === 0) {
      res.json({ success: false, message: "Invalid token" });
      return;
    }

  } catch (err) {
    console.error(`[/fetchCode] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});


app.listen(4000, () => console.log('Server running on http://localhost:4000'));