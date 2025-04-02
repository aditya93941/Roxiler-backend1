const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const db = require('../db');

// Get all stores with ratings
router.get('/', (req, res) => {
  const query = `
    SELECT s.*, u.name as owner_name,
           COUNT(r.id) as total_ratings,
           AVG(r.rating) as average_rating
    FROM stores s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
    ORDER BY average_rating DESC
  `;
  
  db.all(query, [], (err, stores) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stores);
  });
});

// Get store details with ratings
router.get('/:id', (req, res) => {
  const query = `
    SELECT s.*, u.name as owner_name,
           COUNT(r.id) as total_ratings,
           AVG(r.rating) as average_rating
    FROM stores s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE s.id = ?
    GROUP BY s.id
  `;
  
  db.get(query, [req.params.id], (err, store) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(store);
  });
});

// Get store ratings
router.get('/:id/ratings', (req, res) => {
  const query = `
    SELECT r.*, u.name as user_name
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.store_id = ?
    ORDER BY r.created_at DESC
  `;
  
  db.all(query, [req.params.id], (err, ratings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(ratings);
  });
});

// Rate a store
router.post('/:id/rate', auth, checkRole(['user']), (req, res) => {
  const { rating, comment } = req.body;
  const storeId = req.params.id;
  
  // Validate rating
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  // Check if store exists
  db.get('SELECT * FROM stores WHERE id = ?', [storeId], (err, store) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Check if user has already rated this store
    db.get(
      'SELECT * FROM ratings WHERE store_id = ? AND user_id = ?',
      [storeId, req.user.id],
      (err, existingRating) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (existingRating) {
          return res.status(400).json({ error: 'You have already rated this store' });
        }
        
        // Create new rating
        db.run(
          'INSERT INTO ratings (store_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
          [storeId, req.user.id, rating, comment],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({
              id: this.lastID,
              store_id: storeId,
              user_id: req.user.id,
              rating,
              comment
            });
          }
        );
      }
    );
  });
});

module.exports = router; 