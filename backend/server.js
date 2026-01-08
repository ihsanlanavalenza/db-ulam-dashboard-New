require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const port = process.env.PORT || 3001;

// Security middleware - helmet (must be early)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// DB Connection (using pool from db.js)
const db = require('./config/db');

// Attach DB pool to app for global access
app.set("db", db);

// Routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const dataRoutes = require('./routes/data.routes');
const dataManagementRoutes = require('./routes/dataManagement.routes');
const exportRoutes = require('./routes/export.routes');
const notificationRoutes = require('./routes/notification.routes');

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes (admin only)
app.use('/api/users', usersRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Data management routes
app.use('/api/data-management', dataManagementRoutes);

// Export routes
app.use('/api/export', exportRoutes);

// Data routes
app.use('/api', dataRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Backend MBU running.");
});

// Admin route
app.get("/admin", (req, res) => {
  res.json({ 
    success: true, 
    message: "Admin panel endpoint",
    server: "MBU Dashboard Backend",
    version: "1.0.0"
  });
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