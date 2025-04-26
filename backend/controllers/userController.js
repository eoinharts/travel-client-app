require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');

const JWT_SECRET  = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// Register a new user
exports.register = async (req, res) => {
  const { username, password, email, address } = req.body;
  console.log('[Register] attempt for:', username);

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (!/^[\w-.]+@([\w-]+\.)+\w{2,}$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      `INSERT INTO users (username, password, email, address)
       VALUES (?, ?, ?, ?)`,
      [username, hash, email, address]
    );

    console.log('[Register] user created with id:', result.insertId);
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (err) {
    console.error('[Register] DB error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// Login an existing user
exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log('[Login] attempt for:', username);

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, username, password, email, address
       FROM users WHERE username = ?`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2h' });
    delete user.password;

    console.log('[Login] success, issuing token');
    res.json({ message: 'Login successful', user, token });
  } catch (err) {
    console.error('[Login] DB error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};
