import express, { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User.js";
import authenticate from "../middleware/auth.js";
import handleValidationErrors from "../middleware/handleValidationErrors.js"

const router = express.Router();

// Validation
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// POST /api/auth/register
router.post("/register",
  registerValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const user = await User.create({ name, email, password });

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ error: "Internal server error" });
      }

      const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] | undefined;
      const signOptions: SignOptions = expiresIn ? { expiresIn } : {};

      const token = jwt.sign({ userId: String(user._id) }, secret, signOptions);

      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "An error occurred" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user and explicitly include password
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = await (user as any).comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ error: "Internal server error" });
      }

      const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] | undefined;
      const signOptions: SignOptions = expiresIn ? { expiresIn } : {};

      const token = jwt.sign({ userId: String(user._id) }, secret, signOptions);

      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "An error occurred" });
    }
  }
);

// GET /api/auth/me — Get current user (protected)
router.get("/me", authenticate, (req, res) => {
  res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
});

export default router;