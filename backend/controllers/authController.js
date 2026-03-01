import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
    });

    // Generate authentication token and set HTTP-only cookie
    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
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
      message: "Account created successfully",
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
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: true,
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