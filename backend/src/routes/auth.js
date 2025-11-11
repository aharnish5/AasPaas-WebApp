import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  changeEmail,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'vendor']).withMessage('Invalid role'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^\+[1-9][0-9]{7,14}$/)
    .withMessage('Phone must include country code, e.g., +91XXXXXXXXXX'),
];

// Login can use email or phone via 'identifier'
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or phone is required')
    .custom((val) => {
      const isEmail = /.+@.+\..+/.test(val);
      const isPhone = /^\+[1-9][0-9]{7,14}$/.test(val);
      if (!isEmail && !isPhone) {
        throw new Error('Identifier must be a valid email or phone in +countrycode format');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Routes
router.post('/signup', signupValidation, validateRequest, signup);
router.post('/login', loginValidation, validateRequest, login);
router.patch('/profile', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional({ nullable: true }).trim().matches(/^\+[1-9][0-9]{7,14}$/).withMessage('Phone must be +countrycode followed by digits'),
], authenticate, validateRequest, updateProfile);
router.patch('/change-password', [
  body('oldPassword').notEmpty().withMessage('Old password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], authenticate, validateRequest, changePassword);
router.patch('/change-email', [
  body('password').notEmpty().withMessage('Password required'),
  body('newEmail').isEmail().withMessage('Valid newEmail is required'),
], authenticate, validateRequest, changeEmail);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;

