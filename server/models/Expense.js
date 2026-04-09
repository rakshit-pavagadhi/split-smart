const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping', 'Utilities', 'Medical', 'Education', 'Other'],
    default: 'Other'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'custom'],
    default: 'equal'
  },
  splits: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  receipt: {
    url: String,
    filename: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate splits total equals expense amount
expenseSchema.pre('save', function() {
  if (this.splits && this.splits.length > 0) {
    const splitsTotal = this.splits.reduce((sum, split) => sum + split.amount, 0);
    const diff = Math.abs(splitsTotal - this.amount);
    if (diff > 0.01) {
      throw new Error(`Split amounts (${splitsTotal}) must equal expense amount (${this.amount})`);
    }
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
