const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const db = require('../db');

// Password validation function
const isValidPassword = (password) => {
  // Only allow letters and numbers
  const passwordRegex = /^[a-zA-Z0-9]+$/;
  return passwordRegex.test(password);
};

// Get user profile
router.get('/profile', auth, checkRole(['user']), (req, res) => {
  db.get(
    'SELECT id, name, email, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Update user profile
router.put('/profile', auth, checkRole(['user']), (req, res) => {
  const { name } = req.body;
  
  db.run(
    'UPDATE users SET name = ? WHERE id = ?',
    [name, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Change password
router.put('/change-password', auth, checkRole(['user']), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Validate new password format
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: 'New password can only contain letters and numbers' });
  }
  
  // Get user with current password
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Password updated successfully' });
      }
    );
  });
});

// Get user's rating history
router.get('/ratings', auth, checkRole(['user']), (req, res) => {
  const query = `
    SELECT r.*, s.name as store_name, s.address as store_address
    FROM ratings r
    JOIN stores s ON r.store_id = s.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;
  
  db.all(query, [req.user.id], (err, ratings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(ratings);
  });
});

module.exports = router; 