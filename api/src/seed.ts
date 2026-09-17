import dotenv from 'dotenv';
import User from './models/User.js';
import Policy from './models/Policy.js';
import Claim from './models/Claim.js';
import Counter from './models/Counter.js';
import connectDB from './config/db.js';


dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Policy.deleteMany({});
    await Claim.deleteMany({});
    await Counter.deleteMany({});
    console.log('Existing data cleared');

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        role: 'admin',
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'adjuster',
      },
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        password: 'password123',
        role: 'adjuster',
      },
    ]);
    console.log(`Created ${users.length} users`);

    // Create policies
    console.log('Creating policies...');
    const policies = await Policy.create([
      {
        policyNumber: 'AUTO-2024-001',
        holderName: 'John Doe',
        type: 'auto',
        premium: 1200,
        status: 'active',
        effectiveDate: '2024-01-15',
        expriationDate: '2025-01-15',
        owner: users[0]._id,
      },
      {
        policyNumber: 'HOME-2024-002',
        holderName: 'Jane Smith',
        type: 'home',
        premium: 1800,
        status: 'active',
        effectiveDate: '2023-06-01',
        expriationDate: '2026-06-01',
        owner: users[1]._id,
      },
      {
        policyNumber: 'LIFE-2024-003',
        holderName: 'Robert Brown',
        type: 'life',
        premium: 500,
        status: 'active',
        effectiveDate: '2022-03-10',
        expriationDate: '2027-03-10',
        owner: users[2]._id,
      },
      {
        policyNumber: 'AUTO-2023-004',
        holderName: 'Michael Wilson',
        type: 'auto',
        premium: 950,
        status: 'expired',
        effectiveDate: '2022-05-20',
        expriationDate: '2024-05-20',
        owner: users[0]._id,
      },
      {
        policyNumber: 'HOME-2024-005',
        holderName: 'Sarah Martinez',
        type: 'home',
        premium: 2100,
        status: 'cancelled',
        effectiveDate: '2023-01-01',
        expriationDate: '2026-01-01',
        owner: users[1]._id,
      },
    ]);
    console.log(`Created ${policies.length} policies`);

    // Create claims
    console.log('Creating claims...');
    const claims = await Claim.create([
      {
        claimNumber: 'CLM-0001',
        policy: policies[0]._id,
        description: 'Rear-end collision on highway',
        incidentDate: '2024-09-10',
        amount: 5000,
        status: 'submitted',
        assignedTo: users[1]._id,
        notes: [
          {
            text: 'Claim received. Awaiting documentation.',
            createdBy: users[1]._id,
          },
        ],
      },
      {
        claimNumber: 'CLM-0002',
        policy: policies[1]._id,
        description: 'Water damage from burst pipe',
        incidentDate: '2024-08-15',
        amount: 8500,
        status: 'under-review',
        assignedTo: users[2]._id,
        notes: [
          {
            text: 'Initial inspection completed.',
            createdBy: users[2]._id,
          },
          {
            text: 'Waiting for contractor estimate.',
            createdBy: users[2]._id,
          },
        ],
      },
      {
        claimNumber: 'CLM-0003',
        policy: policies[2]._id,
        description: 'Beneficiary claim payout request',
        incidentDate: '2024-09-01',
        amount: 100000,
        status: 'approved',
        assignedTo: users[1]._id,
        notes: [
          {
            text: 'All documentation verified.',
            createdBy: users[1]._id,
          },
          {
            text: 'Claim approved for full payout.',
            createdBy: users[0]._id,
          },
        ],
      },
      {
        claimNumber: 'CLM-0004',
        policy: policies[0]._id,
        description: 'Windshield replacement claim',
        incidentDate: '2024-07-20',
        amount: 350,
        status: 'closed',
        assignedTo: users[1]._id,
        notes: [
          {
            text: 'Claim processed and closed.',
            createdBy: users[1]._id,
          },
        ],
      },
      {
        claimNumber: 'CLM-0005',
        policy: policies[1]._id,
        description: 'Roof damage from storm',
        incidentDate: '2024-06-10',
        amount: 12000,
        status: 'denied',
        assignedTo: users[2]._id,
        notes: [
          {
            text: 'Damage appears to be pre-existing.',
            createdBy: users[2]._id,
          },
          {
            text: 'Claim denied due to policy exclusions.',
            createdBy: users[0]._id,
          },
        ],
      },
      {
        claimNumber: 'CLM-0006',
        policy: policies[3]._id,
        description: 'Vehicle theft claim',
        incidentDate: '2024-09-05',
        amount: 22000,
        status: 'under-review',
        assignedTo: users[1]._id,
        notes: [
          {
            text: 'Police report received.',
            createdBy: users[1]._id,
          },
        ],
      },
    ]);
    console.log(`Created ${claims.length} claims`);

    await Counter.findOneAndUpdate(
      { name: 'claimNumber' },
      {
        $set: {
          name: 'claimNumber',
          seq: claims.length,
        },
      },
      { upsert: true },
    );
    console.log(`Synchronized claim counter to ${claims.length}`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error seeding database:', errorMessage);
    process.exit(1);
  }
};

seedDatabase();
