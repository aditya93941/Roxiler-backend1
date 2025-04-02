const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const db = require('../db');

// Get all users
router.get('/users', auth, checkRole(['admin']), (req, res) => {
  db.all('SELECT id, name, email, role, created_at FROM users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Get all stores
router.get('/stores', auth, checkRole(['admin']), (req, res) => {
  const query = `
    SELECT s.*, u.name as owner_name, u.email as owner_email,
           COUNT(r.id) as total_ratings,
           AVG(r.rating) as average_rating
    FROM stores s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
  `;
  
  db.all(query, [], (err, stores) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stores);
  });
});

// Delete user
router.delete('/users/:id', auth, checkRole(['admin']), (req, res) => {
  const userId = req.params.id;
  
  // Check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Delete store
router.delete('/stores/:id', auth, checkRole(['admin']), (req, res) => {
  const storeId = req.params.id;
  
  // Check if store exists
  db.get('SELECT * FROM stores WHERE id = ?', [storeId], (err, store) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Delete store and its ratings
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM ratings WHERE store_id = ?', [storeId]);
    db.run('DELETE FROM stores WHERE id = ?', [storeId], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Database error' });
      }
      db.run('COMMIT');
      res.json({ message: 'Store deleted successfully' });
    });
  });
});

module.exports = router; 