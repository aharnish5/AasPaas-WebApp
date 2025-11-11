import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../config/logger.js';

// Register new user
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, defaultLocation, phone } = req.body;

    // Validate role
    const validRoles = ['customer', 'vendor'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists (email)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Normalize and check phone if provided
    let normalizedPhone;
    if (phone) {
      normalizedPhone = String(phone).trim().replace(/[\s-]/g, '');
      if (!/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Phone must be in +countrycode format (E.164), e.g., +91XXXXXXXXXX' });
      }
      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        return res.status(400).json({ error: 'Phone already registered' });
      }
    }

    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      role: role || 'customer',
    };

    if (normalizedPhone) {
      userData.phone = normalizedPhone;
    }

    // Add default location if provided
    if (defaultLocation) {
      userData.defaultLocation = {
        rawAddress: defaultLocation.rawAddress || '',
        location: {
          type: 'Point',
          coordinates: defaultLocation.coordinates || [0, 0],
        },
      };
    }

    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toPublicJSON(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password required' });
    }
    const trimmed = String(identifier).trim();
    const isEmail = /.+@.+\..+/.test(trimmed);
    let query;
    if (isEmail) {
      query = { email: trimmed.toLowerCase() };
    } else {
      const normalizedPhone = trimmed.replace(/[\s-]/g, '');
      if (!/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Phone must be in +countrycode format (E.164), e.g., +91XXXXXXXXXX' });
      }
      query = { phone: normalizedPhone };
    }
    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (role && user.role !== role) {
      return res.status(403).json({ error: `Access denied. This account is for ${user.role}s` });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: 'Login successful', user: user.toPublicJSON(), accessToken });
  } catch (error) { next(error); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password required' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await user.comparePassword(oldPassword);
    if (!valid) return res.status(401).json({ error: 'Old password incorrect' });
    user.passwordHash = newPassword;
    // Invalidate existing refresh tokens for security
    user.refreshTokens = [];
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) { next(error); }
};

export const changeEmail = async (req, res, next) => {
  try {
    const { password, newEmail } = req.body;
    if (!password || !newEmail) return res.status(400).json({ error: 'Password and newEmail required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Password incorrect' });
    const exists = await User.findOne({ email: newEmail.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Email already in use' });
    user.email = newEmail.toLowerCase();
    user.isEmailVerified = false; // require re-verification (placeholder)
    await user.save();
    res.json({ message: 'Email updated successfully', user: user.toPublicJSON() });
  } catch (error) { next(error); }
};

// Update profile (name, phone)
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof name === 'string') {
      user.name = name.trim();
    }

    if (typeof phone === 'string') {
      const normalizedPhone = phone.trim().replace(/[\s-]/g, '');
      if (!/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Phone must be in +countrycode format (E.164), e.g., +91XXXXXXXXXX' });
      }
      const exists = await User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ error: 'Phone already in use' });
      user.phone = normalizedPhone;
    }

    await user.save();
    res.json({ message: 'Profile updated', user: user.toPublicJSON() });
  } catch (error) { next(error); }
};

// Refresh access token
export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokenExists = user.refreshTokens.some(
      (tokenObj) => tokenObj.token === refreshToken
    );

    if (!tokenExists) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    res.json({
      accessToken,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -refreshTokens');
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Logout (remove refresh token)
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const user = await User.findById(req.userId);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(
          (tokenObj) => tokenObj.token !== refreshToken
        );
        await user.save();
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If email exists, password reset link sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // TODO: Send email with reset link
    // For now, return token (remove in production)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      message: 'If email exists, password reset link sent',
      // Remove this in production:
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password required' });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update password
    user.passwordHash = password; // Will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

