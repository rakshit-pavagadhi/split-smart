/**
 * Seed script to populate database with demo data
 * Run: node seed.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Group.deleteMany({});
    await Expense.deleteMany({});
    console.log('Cleared existing data');

    // Create users one by one so pre-save hooks fire
    const userDatas = [
      { name: 'Arjun Patel', email: 'arjun@demo.com', password: 'demo123', isVerified: true },
      { name: 'Priya Sharma', email: 'priya@demo.com', password: 'demo123', isVerified: true },
      { name: 'Rahul Verma', email: 'rahul@demo.com', password: 'demo123', isVerified: true },
      { name: 'Sneha Gupta', email: 'sneha@demo.com', password: 'demo123', isVerified: true },
      { name: 'Amit Kumar', email: 'amit@demo.com', password: 'demo123', isVerified: true },
    ];
    const users = [];
    for (const ud of userDatas) {
      const u = new User(ud);
      await u.save();
      users.push(u);
    }
    console.log(`Created ${users.length} users`);

    // Create groups
    const groups = await Group.create([
      {
        name: 'Goa Trip 2024',
        type: 'Travel',
        description: 'Annual friends trip to Goa, splitting all travel, food, and accommodation expenses',
        members: [
          { user: users[0]._id, role: 'admin' },
          { user: users[1]._id, role: 'member' },
          { user: users[2]._id, role: 'member' },
          { user: users[3]._id, role: 'member' },
        ],
        createdBy: users[0]._id,
      },
      {
        name: 'Hostel Room 304',
        type: 'Hostel',
        description: 'Monthly shared expenses for hostel room',
        members: [
          { user: users[0]._id, role: 'admin' },
          { user: users[1]._id, role: 'member' },
          { user: users[4]._id, role: 'member' },
        ],
        createdBy: users[0]._id,
      },
      {
        name: 'Birthday Bash',
        type: 'Event',
        description: "Priya's surprise birthday party expenses",
        members: [
          { user: users[0]._id, role: 'admin' },
          { user: users[2]._id, role: 'member' },
          { user: users[3]._id, role: 'member' },
          { user: users[4]._id, role: 'member' },
        ],
        createdBy: users[0]._id,
      },
    ]);
    console.log(`Created ${groups.length} groups`);

    // Create expenses for Group 1 (Goa Trip)
    const goaExpenses = [
      { desc: 'Flight tickets', amount: 12000, cat: 'Transport', paidBy: 0, date: '2024-12-15' },
      { desc: 'Airbnb Stay (3 nights)', amount: 8500, cat: 'Accommodation', paidBy: 1, date: '2024-12-16' },
      { desc: 'Beach Shack Dinner', amount: 3200, cat: 'Food', paidBy: 2, date: '2024-12-16' },
      { desc: 'Scooter Rentals', amount: 2400, cat: 'Transport', paidBy: 0, date: '2024-12-17' },
      { desc: 'Water Sports Package', amount: 6000, cat: 'Entertainment', paidBy: 3, date: '2024-12-17' },
      { desc: 'Grocery Shopping', amount: 1800, cat: 'Food', paidBy: 1, date: '2024-12-18' },
      { desc: 'Nightclub Entry', amount: 4000, cat: 'Entertainment', paidBy: 0, date: '2024-12-18' },
      { desc: 'Souvenir Shopping', amount: 2500, cat: 'Shopping', paidBy: 2, date: '2024-12-19' },
      { desc: 'Taxi to Airport', amount: 1500, cat: 'Transport', paidBy: 3, date: '2024-12-19' },
    ];

    const goaMembers = [users[0]._id, users[1]._id, users[2]._id, users[3]._id];

    for (const exp of goaExpenses) {
      const memberCount = goaMembers.length;
      const equalAmount = Math.floor((exp.amount / memberCount) * 100) / 100;
      const remainder = Math.round((exp.amount - equalAmount * memberCount) * 100) / 100;

      await Expense.create({
        group: groups[0]._id,
        description: exp.desc,
        amount: exp.amount,
        category: exp.cat,
        paidBy: users[exp.paidBy]._id,
        splitType: 'equal',
        splits: goaMembers.map((uid, i) => ({
          user: uid,
          amount: i === 0 ? equalAmount + remainder : equalAmount,
        })),
        date: new Date(exp.date),
        createdBy: users[exp.paidBy]._id,
      });
    }

    // Create expenses for Group 2 (Hostel)
    const hostelExpenses = [
      { desc: 'WiFi Bill - January', amount: 900, cat: 'Utilities', paidBy: 0, date: '2025-01-05' },
      { desc: 'Grocery Haul', amount: 2400, cat: 'Food', paidBy: 1, date: '2025-01-10' },
      { desc: 'Electricity Bill', amount: 1500, cat: 'Utilities', paidBy: 4, date: '2025-01-15' },
      { desc: 'Pizza Night', amount: 750, cat: 'Food', paidBy: 0, date: '2025-01-20' },
      { desc: 'Cleaning Supplies', amount: 450, cat: 'Other', paidBy: 1, date: '2025-01-25' },
    ];

    const hostelMembers = [users[0]._id, users[1]._id, users[4]._id];

    for (const exp of hostelExpenses) {
      const memberCount = hostelMembers.length;
      const equalAmount = Math.floor((exp.amount / memberCount) * 100) / 100;
      const remainder = Math.round((exp.amount - equalAmount * memberCount) * 100) / 100;

      await Expense.create({
        group: groups[1]._id,
        description: exp.desc,
        amount: exp.amount,
        category: exp.cat,
        paidBy: users[exp.paidBy]._id,
        splitType: 'equal',
        splits: hostelMembers.map((uid, i) => ({
          user: uid,
          amount: i === 0 ? equalAmount + remainder : equalAmount,
        })),
        date: new Date(exp.date),
        createdBy: users[exp.paidBy]._id,
      });
    }

    // Create expenses for Group 3 (Birthday)
    const birthdayExpenses = [
      { desc: 'Cake & Pastries', amount: 2200, cat: 'Food', paidBy: 0, date: '2025-02-14' },
      { desc: 'Decorations & Balloons', amount: 1500, cat: 'Shopping', paidBy: 2, date: '2025-02-14' },
      { desc: 'Gift Contribution', amount: 4000, cat: 'Shopping', paidBy: 3, date: '2025-02-14' },
      { desc: 'Restaurant Dinner', amount: 5500, cat: 'Food', paidBy: 4, date: '2025-02-14' },
    ];

    const birthdayMembers = [users[0]._id, users[2]._id, users[3]._id, users[4]._id];

    for (const exp of birthdayExpenses) {
      const memberCount = birthdayMembers.length;
      const equalAmount = Math.floor((exp.amount / memberCount) * 100) / 100;
      const remainder = Math.round((exp.amount - equalAmount * memberCount) * 100) / 100;

      await Expense.create({
        group: groups[2]._id,
        description: exp.desc,
        amount: exp.amount,
        category: exp.cat,
        paidBy: users[exp.paidBy]._id,
        splitType: 'equal',
        splits: birthdayMembers.map((uid, i) => ({
          user: uid,
          amount: i === 0 ? equalAmount + remainder : equalAmount,
        })),
        date: new Date(exp.date),
        createdBy: users[exp.paidBy]._id,
      });
    }

    console.log('Created all expenses');
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('  Email: arjun@demo.com  | Password: demo123');
    console.log('  Email: priya@demo.com  | Password: demo123');
    console.log('  Email: rahul@demo.com  | Password: demo123');
    console.log('  Email: sneha@demo.com  | Password: demo123');
    console.log('  Email: amit@demo.com   | Password: demo123');
    console.log(`\n📊 Groups: ${groups.length}`);
    console.log(`💰 Expenses: ${goaExpenses.length + hostelExpenses.length + birthdayExpenses.length}`);

    process.exit(0);
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('Validation Error Details:', JSON.stringify(error.errors, null, 2));
    } else {
      console.error('Seed error:', error.message);
    }
    process.exit(1);
  }
};

seed();
