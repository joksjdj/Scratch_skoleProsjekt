const mysql = require("mysql2/promise");
const crypto = require("crypto");

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();
const cookieParser = require("cookie-parser");
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

    const userId = await checkToken(userKey);
    if (!userId) {
      res.json({ success: false, message: "Invalid token" });
      return;
    }

    const projectName = req.query.name;

    console.log(projectName);

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
    });

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

    const userId = await checkToken(userKey);
    if (!userId) {
      res.json({ success: false, message: "Invalid token" });
      return;
    }

    const projectName = req.query.name;

    console.log(projectName, userId);

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
    });

    const [codeRows] = await db.execute(
      `SELECT code, presets FROM written_code WHERE user_id = ? AND name = ?`,
      [userId, projectName]
    );
    console.log(codeRows);

    db.end();

    res.json({ 
      success: true, 
      code: codeRows[0]?.code || "addEvent('keydown', (e) => {\n\n\tconst const x = e.key == 'a' ? -10 : e.key == 'd' ? 10 : 0;\n\tconst y = e.key == 'w' ? -10 : e.key == 's' ? 10 : 0;\n\n\tmoveMentControll('figure', 'figure', 'add', x, y);\n\n}); // type, name, action, x, y (action: add, set)", 
      presets: codeRows[0]?.presets || ""
    });

  } catch (err) {
    console.error(`[/fetchCode] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});

app.get('/setCode', async (req, res) => {
  try {
    console.log('\n\n')

    const userKey = req.session.userKey;
    const userId = await checkToken(userKey);
    if (!userId) {
      res.json({ success: false, message: "Invalid token" });
      return;
    }

    const db = await connectToDatabase();

    await db.connect(err => {
      if (err) throw err;
    });
    
  } catch (err) {
    console.error(`[/setCode] Error at line ${err.stack?.split('\n')[1] || 'unknown'}: ${err.message}`);
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});


app.listen(4000, () => console.log('Server running on http://localhost:4000'));