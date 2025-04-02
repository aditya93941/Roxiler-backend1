# Store Rating System Backend

This is the backend API for the Store Rating System, built with Node.js, Express, and SQLite3.

## Features

- User authentication with JWT
- Role-based access control (Admin, User, Store Owner)
- Store management
- Rating system
- User profile management

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for automatic reloading.

### Production Mode
```bash
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Admin
- GET `/api/admin/users` - Get all users
- GET `/api/admin/stores` - Get all stores
- DELETE `/api/admin/users/:id` - Delete a user
- DELETE `/api/admin/stores/:id` - Delete a store

### User
- GET `/api/user/profile` - Get user profile
- PUT `/api/user/profile` - Update user profile
- PUT `/api/user/change-password` - Change password
- GET `/api/user/ratings` - Get user's rating history

### Store Owner
- GET `/api/store-owner/store` - Get store owner's store
- POST `/api/store-owner/store` - Create a store
- PUT `/api/store-owner/store` - Update store
- GET `/api/store-owner/ratings` - Get store ratings

### Stores (Public)
- GET `/api/stores` - Get all stores with ratings
- GET `/api/stores/:id` - Get store details
- GET `/api/stores/:id/ratings` - Get store ratings
- POST `/api/stores/:id/rate` - Rate a store

## Database Schema

### Users Table
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT)
- role (TEXT)
- created_at (DATETIME)

### Stores Table
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- address (TEXT)
- owner_id (INTEGER)
- created_at (DATETIME)

### Ratings Table
- id (INTEGER PRIMARY KEY)
- store_id (INTEGER)
- user_id (INTEGER)
- rating (INTEGER)
- comment (TEXT)
- created_at (DATETIME)

## Technologies Used

- Node.js
- Express
- SQLite3
- JWT
- bcryptjs
- cors
- dotenv 