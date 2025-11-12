const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage (replace with database in production)
const users = new Map();
const passwordResetTokens = new Map();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = (io, moduleManager) => {
  // Register new user
  router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 })
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userId = uuidv4();
      const user = {
        id: userId,
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        verified: false,
        createdAt: new Date().toISOString()
      };

      users.set(userId, user);

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed', message: error.message });
    }
  });

  // Login
  router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const user = Array.from(users.values()).find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed', message: error.message });
    }
  });

  // Get current user profile
  router.get('/me', authenticateToken, (req, res) => {
    const user = users.get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      verified: user.verified,
      createdAt: user.createdAt
    });
  });

  // Request password reset
  router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = Array.from(users.values()).find(u => u.email === email);

    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = uuidv4();
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiresAt: Date.now() + 3600000 // 1 hour
    });

    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      // For testing purposes only - remove in production
      resetToken 
    });
  });

  // Reset password
  router.post('/reset-password', [
    body('token').exists(),
    body('newPassword').isLength({ min: 6 })
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;
    const resetData = passwordResetTokens.get(token);

    if (!resetData || resetData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    try {
      const user = users.get(resetData.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      // Remove used token
      passwordResetTokens.delete(token);

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ error: 'Password reset failed', message: error.message });
    }
  });

  // Logout (client-side should remove token)
  router.post('/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logout successful' });
  });

  return router;
};

// Export middleware for other modules
module.exports.authenticateToken = authenticateToken;
