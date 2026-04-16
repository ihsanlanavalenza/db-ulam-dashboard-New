require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3001;

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3003',
];

const envAllowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

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

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server and same-origin requests without an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
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

// Backend health route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend API is running',
    server: "MBU Dashboard Backend",
    version: "1.0.0"
  });
});

// If Node.js app is mounted on the main domain in cPanel,
// serve React build files from ../ (public_html) for non-API routes.
const frontendRootPath = path.resolve(__dirname, '..');
const frontendIndexPath = path.join(frontendRootPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

if (hasFrontendBuild) {
  app.use(express.static(frontendRootPath));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.send('Backend MBU running. Frontend build not found.');
  });
}

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