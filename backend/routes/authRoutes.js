import express from "express";
import { body } from "express-validator";

import {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyEmailOtp,
  resendOtp,
} from "../controllers/authController.js";

import protect from "../middleware/auth.js";
const router = express.Router();

// Validation middleware
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const emailValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

const verifyOtpValidation = [
  ...emailValidation,
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),
];

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", logout);
router.post("/verify-email", verifyOtpValidation, verifyEmailOtp);
router.post("/resend-otp", emailValidation, resendOtp);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/updateProfile", protect, updateProfile);
router.post("/change-password", protect, changePassword);

export default router;
