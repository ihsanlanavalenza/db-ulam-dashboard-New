// backend/routes/users.routes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// All user management routes require authentication and admin role
const adminOnly = [requireAuth, requireRole(['admin'])];

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/', adminOnly, usersController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Admin only
 */
router.get('/:id', adminOnly, usersController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post('/', adminOnly, usersController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin only
 */
router.put('/:id', adminOnly, usersController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Admin only
 */
router.delete('/:id', adminOnly, usersController.deleteUser);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Admin only
 */
router.patch('/:id/toggle-status', adminOnly, usersController.toggleUserStatus);

module.exports = router;
