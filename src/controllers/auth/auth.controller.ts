import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
import { Session } from '../../models/session.model';
import { Device } from '../../models/device.model';
import { OTP } from '../../models/otp.model';
import { LoginHistory } from '../../models/login-history.model';
import { AppError } from '../../middleware/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateOTP,
} from '../../utils/jwt.util';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../utils/password.util';
import { parseDeviceInfo, getDeviceName } from '../../utils/device.util';
import {
  sendVerificationOTPEmail,
  sendPasswordResetOTPEmail,
  sendLoginSuccessEmail,
  sendPasswordResetSuccessEmail,
} from '../../utils/email.utils';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;

// Register - Step 1: Send OTP to email without creating user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Register request body:', req.body);
    const { firstName, lastName, email, phone, password, confirmPassword, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      throw new AppError('All fields are required', 400, 'MISSING_FIELDS');
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400, 'WEAK_PASSWORD');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
    }

    // Clear any previous unverified registration OTPs for this email
    await OTP.deleteMany({
      type: 'registration',
      'metadata.email': email,
      isVerified: false,
    });

    // Generate OTP for email verification
    const otp = generateOTP();

    // Store OTP with registration data (temporary)
    await OTP.create({
      type: 'registration',
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), // 15 minutes
      metadata: {
        firstName,
        lastName,
        email,
        phone,
        password, // Will be hashed after verification
        role: role || 'employee',
      },
      ipAddress: req.ip,
    });

    // Send OTP email
    await sendVerificationOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      data: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Complete Registration - Step 2: Verify OTP and create user
export const completeRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    // Find valid OTP for registration
    const otpRecord = await OTP.findOne({
      type: 'registration',
      'metadata.email': email,
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Check if email matches
    if (otpRecord.metadata?.email !== email) {
      throw new AppError('Email does not match registration data', 400, 'EMAIL_MISMATCH');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await hashPassword(otpRecord.metadata.password);

    // Generate employee ID in CG-XXXX format - simple sequential approach
    let employeeId: string;
    let nextNumber = 1;
    const maxAttempts = 1000;

    while (nextNumber <= maxAttempts) {
      employeeId = `CG-${nextNumber.toString().padStart(4, '0')}`;

      try {
        // Try to create user with this ID
        const user = await User.create({
          firstName: otpRecord.metadata.firstName,
          lastName: otpRecord.metadata.lastName,
          email: otpRecord.metadata.email,
          phone: otpRecord.metadata.phone,
          password: hashedPassword,
          role: otpRecord.metadata.role || 'employee',
          employeeId,
          isActive: true,
        });

        // Mark OTP as verified
        otpRecord.isVerified = true;
        otpRecord.userId = user._id;
        await otpRecord.save();

        // Generate tokens
        const payload = {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Create session
        await Session.create({
          userId: user._id,
          token: accessToken,
          refreshToken,
          deviceInfo: parseDeviceInfo(req.get('user-agent') || ''),
          ipAddress: req.ip,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        res.status(201).json({
          success: true,
          message: 'Registration completed successfully',
          data: {
            user: {
              id: user._id,
              email: user.email,
              role: user.role,
            },
            accessToken,
            refreshToken,
          },
        });
        return; // Success
      } catch (createError: any) {
        // If duplicate key error, try next number
        if (createError.code === 11000 && createError.keyPattern?.employeeId) {
          console.log(`Employee ID ${employeeId} exists, trying next...`);
          nextNumber++;
          continue;
        }
        throw createError; // Re-throw other errors
      }
    }

    throw new AppError('Unable to generate unique employee ID. Please contact support.', 500, 'ID_GENERATION_FAILED');
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      await LoginHistory.create({
        userId: new mongoose.Types.ObjectId(),
        email,
        status: 'failed',
        failureReason: 'User not found',
        ipAddress,
        deviceInfo: parseDeviceInfo(userAgent),
      });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      await LoginHistory.create({
        userId: user._id,
        email,
        status: 'failed',
        failureReason: 'Account not active',
        ipAddress,
        deviceInfo: parseDeviceInfo(userAgent),
      });
      throw new AppError('Account is not active. Please verify your email or contact support.', 401, 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId ? user.employeeId.toString() : undefined,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Parse device info
    const deviceInfo = parseDeviceInfo(userAgent);

    // Create session
    const sessionExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const session = await Session.create({
      userId: user._id,
      token: accessToken,
      refreshToken,
      deviceInfo,
      ipAddress,
      isActive: true,
      expiresAt: new Date(Date.now() + sessionExpiry),
    });

    // Update or create device record
    const deviceName = getDeviceName(deviceInfo);
    await Device.findOneAndUpdate(
      {
        userId: user._id,
        userAgent,
      },
      {
        name: deviceName,
        deviceType: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        userAgent,
        ipAddress,
        lastUsed: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update last login safely without triggering full document validation on legacy user fields
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });


    // Log successful login
    await LoginHistory.create({
      userId: user._id,
      email,
      status: 'success',
      ipAddress,
      deviceInfo,
      sessionId: session._id,
    });

    // Send security notification email asynchronously
    (async () => {
      try {
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        const deviceString = `${deviceInfo.browser || 'Browser'} on ${deviceInfo.os || 'Device'} (${deviceInfo.device || 'Desktop'})`;
        const loginTimeStr = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'medium',
        });
        await sendLoginSuccessEmail(user.email, userName, ipAddress, deviceString, loginTimeStr);
      } catch (err) {
        console.error('Failed to send login notification email:', err);
      }
    })();

    // Console log user details after successful login

    console.log('=== USER LOGIN SUCCESS ===');
    console.log('User ID:', user._id.toString());
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Employee ID:', user.employeeId || 'N/A');
    console.log('Is Active:', user.isActive);
    console.log('Last Login:', user.lastLogin);
    console.log('Login Time:', new Date().toISOString());
    console.log('IP Address:', ipAddress);
    console.log('==========================');
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken, // Included for mobile clients (web uses the HTTP-only cookie above)
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;

    await Session.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accept from cookie (web) or request body (mobile)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not found', 401, 'NO_REFRESH_TOKEN');
    }

    const payload = verifyToken(refreshToken);

    const session = await Session.findOne({
      refreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    session.token = newAccessToken;
    session.lastActivity = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify Email OTP
export const verifyEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email, otp } = req.body;

    let filter: any = {
      type: 'email_verification',
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    };

    if (userId) {
      filter.userId = userId;
    } else if (email) {
      filter['metadata.email'] = email;
    }

    const otpRecord = await OTP.findOne(filter).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    if (userId) {
      await User.findByIdAndUpdate(userId, { isActive: true });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('If an account exists with this email, a reset link has been sent.', 200, 'EMAIL_SENT');
    }

    // Delete any previous unverified password reset OTPs for this user
    await OTP.deleteMany({
      userId: user._id,
      type: 'password_reset',
      isVerified: false,
    });

    const otp = generateOTP();
    await OTP.create({
      userId: user._id,
      type: 'password_reset',
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), // 5 minutes
    });

    await sendPasswordResetOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400, 'WEAK_PASSWORD');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const otpRecord = await OTP.findOne({
      userId: user._id,
      type: 'password_reset',
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    const hashedPassword = await hashPassword(newPassword);

    // Update password safely without failing full document validation on legacy users
    await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    // Send password reset success email asynchronously
    (async () => {
      try {
        const resetTimeStr = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'medium',
        });
        await sendPasswordResetSuccessEmail(email, resetTimeStr);
      } catch (err) {
        console.error('Failed to send password reset success email:', err);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });

  } catch (error) {
    next(error);
  }
};

// Resend OTP for Registration, Verification, or Password Reset
export const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email, userId, type } = req.body;

    // 1. Handle Registration OTP resend (before user document exists)
    if (type === 'registration') {
      const targetEmail = email;
      if (!targetEmail) {
        throw new AppError('Email is required to resend registration OTP', 400, 'MISSING_EMAIL');
      }

      // Find previous OTP metadata
      const lastOtp = await OTP.findOne({
        type: 'registration',
        'metadata.email': targetEmail,
      }).sort({ createdAt: -1 });

      // Delete older unverified registration OTPs
      await OTP.deleteMany({
        type: 'registration',
        'metadata.email': targetEmail,
        isVerified: false,
      });

      const otp = generateOTP();
      await OTP.create({
        type: 'registration',
        otp,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        metadata: lastOtp?.metadata || { email: targetEmail, role: 'employee' },
        ipAddress: req.ip,
      });

      await sendVerificationOTPEmail(targetEmail, otp);

      return res.status(200).json({
        success: true,
        message: `New verification OTP sent successfully to ${targetEmail}`,
      });
    }

    // 2. Handle Password Reset OTP resend
    if (type === 'password_reset') {
      let targetUser = null;
      if (userId) {
        targetUser = await User.findById(userId);
      } else if (email) {
        targetUser = await User.findOne({ email });
      }

      if (!targetUser) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, a reset OTP has been sent.',
        });
      }

      await OTP.deleteMany({
        userId: targetUser._id,
        type: 'password_reset',
        isVerified: false,
      });

      const otp = generateOTP();
      await OTP.create({
        userId: targetUser._id,
        type: 'password_reset',
        otp,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      });

      await sendPasswordResetOTPEmail(targetUser.email, otp);

      return res.status(200).json({
        success: true,
        message: `New password reset OTP sent successfully to ${targetUser.email}`,
      });
    }

    // 3. Handle User-bound Email Verification OTP resend
    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) {
      throw new AppError('User not found for OTP resend', 404, 'USER_NOT_FOUND');
    }

    await OTP.deleteMany({
      userId: targetUser._id,
      type: type || 'email_verification',
      isVerified: false,
    });

    const otp = generateOTP();
    await OTP.create({
      userId: targetUser._id,
      type: type || 'email_verification',
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    await sendVerificationOTPEmail(targetUser.email, otp);

    return res.status(200).json({
      success: true,
      message: `New OTP sent successfully to ${targetUser.email}`,
    });
  } catch (error) {
    next(error);
  }
};

