const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const db = require('../db');

// Get store owner's store
router.get('/store', auth, checkRole(['store_owner']), (req, res) => {
  const query = `
    SELECT s.*, u.name as owner_name, u.email as owner_email,
           COUNT(r.id) as total_ratings,
           AVG(r.rating) as average_rating
    FROM stores s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE s.owner_id = ?
    GROUP BY s.id
  `;
  
  db.get(query, [req.user.id], (err, store) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(store);
  });
});

// Create store
router.post('/store', auth, checkRole(['store_owner']), (req, res) => {
  const { name, address } = req.body;
  
  // Check if store owner already has a store
  db.get('SELECT * FROM stores WHERE owner_id = ?', [req.user.id], (err, existingStore) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (existingStore) {
      return res.status(400).json({ error: 'You already have a store' });
    }
    
    // Create new store
    db.run(
      'INSERT INTO stores (name, address, owner_id) VALUES (?, ?, ?)',
      [name, address, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({
          id: this.lastID,
          name,
          address,
          owner_id: req.user.id
        });
      }
    );
  });
});

// Update store
router.put('/store', auth, checkRole(['store_owner']), (req, res) => {
  const { name, address } = req.body;
  
  db.run(
    'UPDATE stores SET name = ?, address = ? WHERE owner_id = ?',
    [name, address, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({ message: 'Store updated successfully' });
    }
  );
});

// Get store ratings
router.get('/ratings', auth, checkRole(['store_owner']), (req, res) => {
  const query = `
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    JOIN stores s ON r.store_id = s.id
    WHERE s.owner_id = ?
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