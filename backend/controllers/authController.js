import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/emailService.js";

// Returns cookie options based on actual request protocol (works without NODE_ENV)
const getCookieOptions = (req, maxAge = 7 * 24 * 60 * 60 * 1000) => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    maxAge,
  };
};

// Generate and sign a JWT token with the user's ID
const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateSixDigitOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

const issueOtpForUser = async (user) => {
  const otp = generateSixDigitOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail({
    toEmail: user.email,
    username: user.username,
    otp,
  });
};

// @desc Register
// @route POST api/auth/register
// @access public
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if email or username is already taken
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error:
          userExists.email === email
            ? "Email is already in use"
            : "Username is already taken",
        statusCode: 400,
      });
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password,
      verified: false,
      verifed: false,
    });

    await issueOtpForUser(user);

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        requiresVerification: true,
      },
      message: "Account created. OTP sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login
// @route POST api/auth/login
// @access public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
        statusCode: 400,
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        statusCode: 401,
      });
    }

    if (!user.verified && !user.verifed) {
      return res.status(403).json({
        success: false,
        error: "Email not verified. Please verify OTP first.",
        statusCode: 403,
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        statusCode: 401,
      });
    }

    // Generate authentication token and set HTTP-only cookie
    const token = generateToken(user._id);
    res.cookie("token", token, getCookieOptions(req));

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
        },
        token,
      },
      message: "Logged in successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Logout
// @route POST api/auth/logout
// @access public
export const logout = (req, res) => {
  res.clearCookie("token", getCookieOptions(req, 0));
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// @desc Get user profile
// @route GET api/auth/profile
// @access private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        statusCode: 401,
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile
// @route PUT api/auth/profile
// @access private
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    // Ensure username and email are not already taken by another user
    if (username || email) {
      const existing = await User.findOne({
        $or: [username ? { username } : null, email ? { email } : null].filter(
          Boolean,
        ),
        _id: { $ne: req.user._id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error:
            existing.email === email
              ? "Email is already in use"
              : "Username is already taken",
          statusCode: 400,
        });
      }
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Change user password
// @route POST api/auth/change-password
// @access private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide current, new and confirm password",
        statusCode: 400,
      });
    }

    // Fetch user with password field included
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User does not exist",
        statusCode: 400,
      });
    }

    // Ensure new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "New password and confirm password must match",
        statusCode: 400,
      });
    }

    // Verify current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
        statusCode: 400,
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify email using OTP
// @route POST api/auth/verify-email
// @access public
export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
        statusCode: 400,
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404,
      });
    }

    if (user.verified || user.verifed) {
      const token = generateToken(user._id);
      res.cookie("token", token, getCookieOptions(req));

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
          },
          token,
        },
        message: "Email already verified",
      });
    }

    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "OTP expired. Request a new one.",
        statusCode: 400,
      });
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error: "Too many invalid attempts. Request a new OTP.",
        statusCode: 429,
      });
    }

    const isValidOtp = hashOtp(otp) === user.otpHash;
    if (!isValidOtp) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
        statusCode: 400,
      });
    }

    user.verified = true;
    user.verifed = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.cookie("token", token, getCookieOptions(req));

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
        },
        token,
      },
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Resend OTP for email verification
// @route POST api/auth/resend-otp
// @access public
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        statusCode: 400,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404,
      });
    }

    if (user.verified || user.verifed) {
      return res.status(400).json({
        success: false,
        error: "Email already verified",
        statusCode: 400,
      });
    }

    await issueOtpForUser(user);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
