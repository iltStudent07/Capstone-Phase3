import express, { Request, Response } from "express";
import { body, param, query } from "express-validator";
import Policy from "../models/Policy.js";
import authenticate from "../middleware/auth.js";
import handleValidationErrors from "../middleware/handleValidationErrors.js";

const router = express.Router();

// All policy routes require authentication
router.use(authenticate);

const createPolicyValidation = [
    body("holderName")
        .trim()
        .notEmpty()
        .withMessage("holderName is required")
        .isString()
        .withMessage("holderName must be a string"),

    body("type")
        .notEmpty()
        .withMessage("type is required")
        .isIn(["auto", "home", "life"])
        .withMessage("type must be one of: auto, home, life"),

    body("premium")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("premium must be a number greater than or equal to 0")
        .toFloat(),

    body("status")
        .optional()
        .isIn(["active", "expired", "cancelled"])
        .withMessage("status must be one of: active, expired, cancelled"),

];

const updatePolicyValidation = [
    body("holderName")
        .optional()
        .trim()
        .isString()
        .withMessage("holderName must be a string"),

    body("type")
        .optional()
        .isIn(["auto", "home", "life"])
        .withMessage("type must be one of: auto, home, life"),

    body("premium")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("premium must be a number greater than or equal to 0")
        .toFloat(),

    body("status")
        .optional()
        .isIn(["active", "expired", "cancelled"])
        .withMessage("status must be one of: active, expired, cancelled"),

];

const listQueryValidation = [
    query("type")
        .optional()
        .isIn(["auto", "home", "life"])
        .withMessage("type must be one of: auto, home, life"),
    query("status")
        .optional()
        .isIn(["active", "expired", "cancelled"])
        .withMessage("status must be one of: active, expired, cancelled"),
    query("search")
        .optional()
        .isString()
        .withMessage("search must be a string"),
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("page must be an integer >= 1")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("limit must be an integer between 1 and 100")
        .toInt(),
];

const idValidation = [
    param("id").isMongoId().withMessage("id must be a valid MongoDB ObjectId"),
];

// GET /api/policies - List policies with optional query filters + pagination
router.get("/", listQueryValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const { type, status, search } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const currentUserId = (req as any).user._id;
        const currentUserRole = (req as any).user.role;

        const filter: any = {};

        // If not admin, only show policies assigned to current user
        if (currentUserRole !== "admin") {
            filter.owner = currentUserId;
            console.log('Not admin - applying owner filter');
        } else {
            console.log('User is admin - showing all policies');
        }

        if (type) filter.type = type;
        if (status) filter.status = status;

        if (search && String(search).trim()) {
            const searchRegex = new RegExp(String(search).trim(), "i");
            filter.$or = [
                { holderName: searchRegex },
                { policyNumber: searchRegex },
            ];
        }

        console.log('Final filter:', JSON.stringify(filter));

        const [policies, total] = await Promise.all([
            Policy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Policy.countDocuments(filter),
        ]);

        console.log('Policies found:', policies.length, 'Total:', total, 'Page:', page, 'Limit:', limit);

        res.status(200).json({
            data: policies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch policies" });
    }
});

// GET /api/policies/:id - Get single policy by ID (populate owner info)
router.get("/:id", idValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user._id;
        const currentUserRole = (req as any).user.role;

        const filter: any = { _id: req.params.id };

        if (currentUserRole !== "admin") {
            filter.owner = currentUserId;
        }

        const policy = await Policy.findOne(filter).populate("owner", "-password");

        if (!policy) {
            return res.status(404).json({ message: "Policy not found" });
        }

        return res.status(200).json(policy);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch policy" });
    }
});

// POST /api/policies - Create policy (owner = authenticated user)
router.post("/", createPolicyValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const { policyNumber: _policyNumber, ...policyPayload } = req.body;

        const policy = await Policy.create({
            ...policyPayload,
            owner: (req as any).user._id,
        });

        res.status(201).json(policy);
    } catch (error: any) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "policyNumber already exists" });
        }
        return res.status(500).json({ message: "Failed to create policy" });
    }
});

// PUT /api/policies/:id - Update policy (run validators)
router.put(
    "/:id",
    idValidation,
    updatePolicyValidation,
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { policyNumber: _policyNumber, ...updates } = req.body;
            const currentUserId = (req as any).user._id;
            const currentUserRole = (req as any).user.role;

            const filter: any = { _id: req.params.id };

            if (currentUserRole !== "admin") {
                filter.owner = currentUserId;
            }

            const updated = await Policy.findOneAndUpdate(
                filter,
                updates,
                { new: true, runValidators: true }
            ).populate("owner", "-password");

            if (!updated) {
                return res.status(404).json({ message: "Policy not found" });
            }

            return res.status(200).json(updated);
        } catch (error: any) {
            if (error?.code === 11000) {
                return res.status(409).json({ message: "policyNumber already exists" });
            }
            return res.status(500).json({ message: "Failed to update policy" });
        }
    }
);

// DELETE /api/policies/:id - Delete policy
router.delete("/:id", idValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user._id;
        const currentUserRole = (req as any).user.role;

        const filter: any = { _id: req.params.id };

        if (currentUserRole !== "admin") {
            filter.owner = currentUserId;
        }

        const deleted = await Policy.findOneAndDelete(filter);

        if (!deleted) {
            return res.status(404).json({ message: "Policy not found" });
        }

        return res.status(200).json({ message: "Policy deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete policy" });
    }
});

export default router;