// backend/middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;  // Put this in your .env!

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  // Expect header = "Bearer <token>"
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token error.' });
  }
  const token = parts[1];

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    req.userId = decoded.id;
    next();
  });
};
