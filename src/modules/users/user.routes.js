const express = require('express');
const { asyncHandler } = require('../../shared/middlewares/error.middleware');
const { authenticate, requireAdmin } = require('../../shared/middlewares/auth.middleware');
const userController = require('./user.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(userController.listUsers));
router.delete('/:id', asyncHandler(userController.deleteUser));

module.exports = router;
