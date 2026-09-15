export type User = {
    _id:string
    name: string
    email: string
    role: string
}

export type Policy = {
    _id: string
    policyNumber: string
    holderName: string
    type: string
    premium: number
    status: string
    effectiveDate: string
    expriationDate: string
}

export type Claim = {
    _id: string
    claimNumber: string
    policy: string
    description: string
    incidentDate: string
    amount: number
    status: string
    assignedTo: string
    notes: string[]
}

export type DashboardStats = {
    totalClaims: number
    claimsByStatus: number
    totalPolicies: number
    policiesByType: number
    totalUsers: number
    recentClaims: number
    claimAmountAgg: number
}