import 'dotenv/config'
import express from 'express'
import User from '../models/User.js'
import Claim from '../models/Claim.js'
import Policy from '../models/Policy.js'
import authenticate from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const [
      totalClaims,
      claimsByStatus,
      totalPolicies,
      policiesByType,
      totalUsers,
      recentClaims,
      claimAmountAgg,
    ] = await Promise.all([
      Claim.countDocuments(),
      Claim.aggregate<{ status: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Policy.countDocuments(),
      Policy.aggregate<{ type: string; count: number }>([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $project: { _id: 0, type: '$_id', count: 1 } },
      ]),
      User.countDocuments(),
      Claim.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('policy')
        .populate('assignedTo', '-password'),
      Claim.aggregate<{ totalClaimAmount: number }>([
        {
          $group: {
            _id: null,
            totalClaimAmount: { $sum: { $ifNull: ['$amount', 0] } },
          },
        },
        { $project: { _id: 0, totalClaimAmount: 1 } },
      ]),
    ])

    const statusMap = {
      underReview: 0,
      approved: 0,
      submitted: 0,
      denied: 0,
      closed: 0,
    }

    const normalizeStatus = (status: string) =>
      status.toLowerCase().replace(/[^a-z0-9]/g, '')

    for (const item of claimsByStatus) {
      const key = normalizeStatus(item.status)

      if (key === 'underreview') statusMap.underReview = item.count
      if (key === 'approved') statusMap.approved = item.count
      if (key === 'submitted') statusMap.submitted = item.count
      if (key === 'denied') statusMap.denied = item.count
      if (key === 'closed') statusMap.closed = item.count
    }

    res.status(200).json({
      totalClaims,
      claimsByStatus: statusMap,
      totalPolicies,
      policiesByType,
      totalUsers,
      recentClaims,
      totalClaimAmount: claimAmountAgg[0]?.totalClaimAmount ?? 0,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' })
  }
})

export default router