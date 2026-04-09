const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    next();
  };
};

// Auth schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).max(128).required()
});

// Group schemas
const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('Travel', 'Hostel', 'Event', 'Custom').default('Custom'),
  description: Joi.string().max(500).allow('').default('')
});

const joinGroupSchema = Joi.object({
  inviteCode: Joi.string().required()
});

// Expense schemas
const addExpenseSchema = Joi.object({
  description: Joi.string().min(1).max(200).required(),
  amount: Joi.number().positive().required(),
  category: Joi.string().valid('Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping', 'Utilities', 'Medical', 'Education', 'Other').default('Other'),
  paidBy: Joi.string().required(),
  splitType: Joi.string().valid('equal', 'percentage', 'custom').default('equal'),
  splits: Joi.array().items(Joi.object({
    user: Joi.string().required(),
    amount: Joi.number().min(0),
    percentage: Joi.number().min(0).max(100)
  })),
  date: Joi.date().default(() => new Date())
});

// Settlement schemas
const createSettlementSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('razorpay', 'upi', 'cash', 'bank_transfer', 'other').default('other'),
  note: Joi.string().max(200).allow('')
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createGroupSchema,
  joinGroupSchema,
  addExpenseSchema,
  createSettlementSchema
};
