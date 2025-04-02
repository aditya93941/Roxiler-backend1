const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'store_rating.db');
const db = new sqlite3.Database(dbPath);

// Default admin credentials
const DEFAULT_ADMIN_EMAIL = 'admin@store.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'store_owner')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created/verified successfully');
    }
  });

  // Stores table
  db.run(`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating stores table:', err);
    } else {
      console.log('Stores table created/verified successfully');
    }
  });

  // Ratings table
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating ratings table:', err);
    } else {
      console.log('Ratings table created/verified successfully');
    }
  });

  // Create default admin user if not exists
  const bcrypt = require('bcryptjs');
  const defaultAdminPassword = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
  
  // First, check if admin exists
  db.get("SELECT * FROM users WHERE role = 'admin'", (err, row) => {
    if (err) {
      console.error('Error checking for admin user:', err);
      return;
    }
    
    if (!row) {
      console.log('Creating default admin user...');
      // Delete any existing admin user first to avoid conflicts
      db.run("DELETE FROM users WHERE role = 'admin'", (err) => {
        if (err) {
          console.error('Error deleting existing admin:', err);
        }
        
        // Insert new admin user
        db.run(`INSERT INTO users (name, email, password, role) 
                VALUES (?, ?, ?, ?)`,
          ['Admin', DEFAULT_ADMIN_EMAIL, defaultAdminPassword, 'admin'],
          function(err) {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('Default admin user created successfully');
              console.log('Admin email:', DEFAULT_ADMIN_EMAIL);
              console.log('Admin password:', DEFAULT_ADMIN_PASSWORD);
            }
          }
        );
      });
    } else {
      console.log('Admin user already exists');
      console.log('Admin email:', row.email);
    }
  });
});

module.exports = db; 