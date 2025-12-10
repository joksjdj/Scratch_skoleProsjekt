const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // your frontend URL
    credentials: true,               // allow sending cookies
  })
);

// Set up session middleware
app.use(
  session({
    secret: 'yourSecretKey', // Replace with a unique key
    resave: false,           // Avoid resaving unchanged sessions
    saveUninitialized: false, // Only save sessions with initialized data
    cookie: {
      maxAge: 60 * 60000,         // 1-minute session expiry
      sameSite: 'lax', // <- important for cross-origin
      secure: false, 
    },
  })
);

// Example route to demonstrate session usage
app.get('/logintest', (req, res) => {
    if (!req.session.visits) req.session.visits = 0;
    req.session.visits++;
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    console.log('Visits:', req.session.visits);
    res.send(`You have visited this page ${req.session.visits} times.`);
});
app.listen(4000, () => console.log('Server running on http://localhost:4000'));