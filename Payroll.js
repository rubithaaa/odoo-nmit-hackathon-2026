const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    periodName: {
      type: String, // e.g. "August 2026"
      required: true,
    },
    salaryStructure: {
      basicSalary: { type: Number, required: true, default: 5000 },
      hra: { type: Number, default: 2000 },
      conveyanceAllowance: { type: Number, default: 400 },
      medicalAllowance: { type: Number, default: 300 },
      specialAllowance: { type: Number, default: 800 },
      performanceBonus: { type: Number, default: 500 },
      providentFund: { type: Number, default: 600 },
      taxDeduction: { type: Number, default: 950 },
      healthInsurance: { type: Number, default: 250 },
      otherDeductions: { type: Number, default: 0 },
    },
    grossEarnings: {
      type: Number,
      required: true,
    },
    totalDeductions: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: '$',
    },
    status: {
      type: String,
      enum: ['Draft', 'Processed', 'Paid'],
      default: 'Paid',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      default: 'Direct Deposit (ACH)',
    },
    transactionRef: {
      type: String,
      default: () => 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    workingDays: {
      type: Number,
      default: 22,
    },
    paidDays: {
      type: Number,
      default: 22,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate monthly slips for the same user
payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
