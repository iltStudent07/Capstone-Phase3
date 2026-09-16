import express, { Request, Response } from "express";
import { body, param, query } from "express-validator";
import Claim from "../models/Claim.js";
import authenticate from "../middleware/auth.js";
import handleValidationErrors from "../middleware/handleValidationErrors.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// All claim routes require authentication
router.use(authenticate);

const createClaimValidation = [
    body("policy")
        .notEmpty()
        .withMessage("policy is required")
        .isMongoId()
        .withMessage("policy must be a valid MongoDB ObjectId"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("description is required")
        .isString()
        .withMessage("description must be a string"),

    body("incidentDate")
        .notEmpty()
        .withMessage("incidentDate is required")
        .isISO8601()
        .withMessage("incidentDate must be a valid ISO 8601 date"),

    body("amount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("amount must be a number greater than or equal to 0")
        .toFloat(),

    body("status")
        .optional()
        .isIn(["submitted", "under-review", "approved", "denied", "closed"])
        .withMessage("status must be one of: submitted, under-review, approved, denied, closed"),
];

const updateClaimValidation = [
    body("policy")
        .optional()
        .isMongoId()
        .withMessage("policy must be a valid MongoDB ObjectId"),

    body("description")
        .optional()
        .trim()
        .isString()
        .withMessage("description must be a string"),

    body("incidentDate")
        .optional()
        .isISO8601()
        .withMessage("incidentDate must be a valid ISO 8601 date"),

    body("amount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("amount must be a number greater than or equal to 0")
        .toFloat(),

    body("status")
        .optional()
        .isIn(["submitted", "under-review", "approved", "denied", "closed"])
        .withMessage("status must be one of: submitted, under-review, approved, denied, closed"),
];

const listQueryValidation = [
    query("status")
        .optional()
        .isString()
        .withMessage("status must be a string"),

    query("policy")
        .optional()
        .isMongoId()
        .withMessage("policy must be a valid MongoDB ObjectId"),

    query("assignedTo")
        .optional()
        .isMongoId()
        .withMessage("assignedTo must be a valid MongoDB ObjectId"),

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

const addNoteValidation = [
    body("text")
        .trim()
        .notEmpty()
        .withMessage("text is required")
        .isString()
        .withMessage("text must be a string"),
];

// GET /api/claims - List claims with optional filters + pagination
router.get("/", listQueryValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const { status, policy, assignedTo, search } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const currentUserId = (req as any).user._id;
        const currentUserRole = (req as any).user.role;
        
        const filter: any = {};

        // If not admin, only show claims assigned to current user
        if (currentUserRole !== "admin") {
            filter.assignedTo = currentUserId;
            console.log('Not admin - applying assignedTo filter');
        } else {
            console.log('User is admin - showing all claims');
        }

        if (status) filter.status = status;
        if (policy) filter.policy = policy;

        // Keep scoped to authenticated user unless explicitly filtering self, or is admin
        if (assignedTo) {
            if (currentUserRole === "admin" || String(assignedTo) === String(currentUserId)) {
                filter.assignedTo = assignedTo;
            }
        }

        // in search filter, remove title (not in schema)
        if (search && String(search).trim()) {
            const searchRegex = new RegExp(String(search).trim(), "i");
            filter.$or = [
                { claimNumber: searchRegex },
                { description: searchRegex },
            ];
        }

        console.log('Final filter:', JSON.stringify(filter));

        const [claims, total] = await Promise.all([
            Claim.find(filter)
                .populate("policy")
                .populate("assignedTo", "-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Claim.countDocuments(filter),
        ]);

        console.log('Claims found:', claims.length, 'Total:', total);

        return res.status(200).json({
            data: claims,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error in GET /claims:', error);
        return res.status(500).json({ message: "Failed to fetch claims" });
    }
});

// GET /api/claims/stats - Aggregated claim statistics
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const currentUserRole = (req as any).user.role;
        const currentUserId = new ObjectId(String((req as any).user._id));
        
        const matchStage: any = currentUserRole === "admin" ? {} : { assignedTo: currentUserId };

        const [byStatus, totals] = await Promise.all([
            Claim.aggregate<{ status: string; count: number }>([
                { $match: matchStage },
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, status: "$_id", count: 1 } },
            ]),
            Claim.aggregate<{ totalClaims: number; totalClaimAmount: number }>([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalClaims: { $sum: 1 },
                        totalClaimAmount: { $sum: { $ifNull: ["$amount", 0] } },
                    },
                },
                { $project: { _id: 0, totalClaims: 1, totalClaimAmount: 1 } },
            ]),
        ]);

        return res.status(200).json({
            byStatus,
            totalClaims: totals[0]?.totalClaims ?? 0,
            totalClaimAmount: totals[0]?.totalClaimAmount ?? 0,
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch claim stats" });
    }
});

// GET /api/claims/:id - Get single claim by ID
const getClaimAccessFilter = (req: Request, claimId: string) => {
    const currentUserId = (req as any).user._id;
    const currentUserRole = String((req as any).user.role || "").toLowerCase();

    const filter: any = { _id: claimId };

    if (currentUserRole !== "admin") {
        filter.assignedTo = currentUserId;
    }

    return filter;
};

router.get("/:id", idValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const filter = getClaimAccessFilter(req, req.params.id);

        const claim = await Claim.findOne(filter)
            .populate("policy")
            .populate("assignedTo", "-password")
            .populate("notes.createdBy", "-password");

        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        return res.status(200).json(claim);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch claim" });
    }
});

// POST /api/claims - Create claim and auto-assign to authenticated user
router.post("/", createClaimValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const claim = await Claim.create({
            ...req.body,
            assignedTo: (req as any).user._id,
        });

        return res.status(201).json(claim);
    } catch (error: any) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Claim already exists" });
        }
        return res.status(500).json({ message: "Failed to create claim" });
    }
});

// PUT /api/claims/:id - Update claim
router.put(
    "/:id",
    idValidation,
    updateClaimValidation,
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const filter = getClaimAccessFilter(req, req.params.id);

            const updated = await Claim.findOneAndUpdate(
                filter,
                req.body,
                { new: true, runValidators: true }
            )
                .populate("policy")
                .populate("assignedTo", "-password")
                .populate("notes.createdBy", "-password");

            if (!updated) {
                return res.status(404).json({ message: "Claim not found" });
            }

            return res.status(200).json(updated);
        } catch (error: any) {
            if (error?.code === 11000) {
                return res.status(409).json({ message: "Claim already exists" });
            }
            return res.status(500).json({ message: "Failed to update claim" });
        }
    }
);

// POST /api/claims/:id/notes - Add note to claim
router.post(
    "/:id/notes",
    idValidation,
    addNoteValidation,
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const currentUserId = (req as any).user._id;
            const filter = getClaimAccessFilter(req, req.params.id);

            const updatedClaim = await Claim.findOneAndUpdate(
                filter,
                {
                    $push: {
                        notes: {
                            text: req.body.text,
                            createdBy: currentUserId,
                            createdAt: new Date(),
                        },
                    },
                },
                { new: true, runValidators: true }
            );

            if (!updatedClaim) {
                return res.status(404).json({ message: "Claim not found" });
            }

            const populatedClaim = await Claim.findById(updatedClaim._id)
                .populate("policy")
                .populate("assignedTo", "-password")
                .populate("notes.createdBy", "-password");

            return res.status(200).json(populatedClaim);
        } catch (error) {
            console.error("Failed to add note:", error);
            return res.status(500).json({ message: "Failed to add note" });
        }
    }
);

// DELETE /api/claims/:id - Delete claim
router.delete("/:id", idValidation, handleValidationErrors, async (req: Request, res: Response) => {
    try {
        const filter = getClaimAccessFilter(req, req.params.id);

        const deleted = await Claim.findOneAndDelete(filter);

        if (!deleted) {
            return res.status(404).json({ message: "Claim not found" });
        }

        return res.status(200).json({ message: "Claim deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete claim" });
    }
});

export default router;

