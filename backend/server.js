require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection (using pool from db.js)
const db = require('./config/db');

// Attach DB pool to app for global access
app.set("db", db);

// Routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const dataRoutes = require('./routes/data.routes');

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes (admin only)
app.use('/api/users', usersRoutes);

// Data routes
app.use('/api', dataRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Backend MBU running.");
});

// Error handling middleware (must be last)
const { errorHandler, notFound } = require('./middleware/errorHandler');
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Database: ${process.env.DB_NAME}`);
});