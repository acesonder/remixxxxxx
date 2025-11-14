const mongoose = require('mongoose');

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    billingCode: String,
    taxRate: {
      type: Number,
      default: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balancedue: Number,
  payments: [{
    paymentId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    date: Date,
    method: String
  }],
  notes: String,
  terms: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other'],
    required: true
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  referenceNumber: String,
  notes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Grant Schema
const grantSchema = new mongoose.Schema({
  grantName: {
    type: String,
    required: true
  },
  grantNumber: String,
  fundingSource: {
    type: String,
    required: true
  },
  grantType: {
    type: String,
    enum: ['federal', 'state', 'local', 'private', 'foundation', 'corporate'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'awarded', 'active', 'completed', 'rejected', 'renewed'],
    default: 'pending'
  },
  restrictions: String,
  reportingRequirements: [{
    reportType: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'overdue'],
      default: 'pending'
    },
    submittedDate: Date
  }],
  expenditures: [{
    date: Date,
    amount: Number,
    category: String,
    description: String,
    documentId: mongoose.Schema.Types.ObjectId
  }],
  totalExpended: {
    type: Number,
    default: 0
  },
  remainingBalance: Number,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Donation Schema
const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true
  },
  donorEmail: String,
  donorPhone: String,
  donorAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  amount: {
    type: Number,
    required: true
  },
  donationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  donationType: {
    type: String,
    enum: ['one_time', 'recurring', 'in_kind'],
    required: true
  },
  recurringFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other'],
    required: true
  },
  transactionId: String,
  campaign: String,
  designation: {
    type: String,
    enum: ['general', 'program', 'building', 'endowment', 'specific'],
    default: 'general'
  },
  specificDesignation: String,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  taxReceiptIssued: {
    type: Boolean,
    default: false
  },
  taxReceiptNumber: String,
  taxReceiptDate: Date,
  acknowledgementSent: {
    type: Boolean,
    default: false
  },
  acknowledgementDate: Date,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Budget Schema
const budgetSchema = new mongoose.Schema({
  fiscalYear: {
    type: Number,
    required: true
  },
  budgetName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'proposed', 'approved', 'active', 'closed'],
    default: 'draft'
  },
  categories: [{
    categoryName: {
      type: String,
      required: true
    },
    budgetedAmount: {
      type: Number,
      required: true
    },
    actualAmount: {
      type: Number,
      default: 0
    },
    variance: Number,
    subcategories: [{
      name: String,
      budgeted: Number,
      actual: Number
    }]
  }],
  totalBudgeted: {
    type: Number,
    required: true
  },
  totalActual: {
    type: Number,
    default: 0
  },
  totalVariance: Number,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date
}, {
  timestamps: true
});

// Expense Schema
const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  vendor: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'other'],
    required: true
  },
  receiptUrl: String,
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  grantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grant'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  paidDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

paymentSchema.index({ clientId: 1, paymentDate: -1 });
paymentSchema.index({ invoiceId: 1 });

grantSchema.index({ status: 1, endDate: 1 });
grantSchema.index({ fundingSource: 1 });
grantSchema.index({ grantNumber: 1 });

donationSchema.index({ donorName: 1, donationDate: -1 });
donationSchema.index({ donationType: 1, recurringFrequency: 1 });
donationSchema.index({ campaign: 1 });

budgetSchema.index({ fiscalYear: 1, status: 1 });

expenseSchema.index({ date: 1, category: 1 });
expenseSchema.index({ budgetId: 1 });
expenseSchema.index({ grantId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Grant = mongoose.model('Grant', grantSchema);
const Donation = mongoose.model('Donation', donationSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const Expense = mongoose.model('Expense', expenseSchema);

module.exports = {
  Invoice,
  Payment,
  Grant,
  Donation,
  Budget,
  Expense
};
