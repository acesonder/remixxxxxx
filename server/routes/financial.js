const express = require('express');
const router = express.Router();
const { Invoice, Payment, Grant, Donation, Budget, Expense } = require('../models/Financial');
const { protect, authorize } = require('../middleware/auth');

// ========== INVOICE ROUTES ==========

// Get all invoices
router.get('/invoices', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { clientId, status, startDate, endDate } = req.query;
    let query = {};

    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ issueDate: -1 })
      .limit(100);

    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create invoice
router.post('/invoices', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      createdBy: req.user._id,
      balanceDue: req.body.totalAmount - (req.body.paidAmount || 0)
    };

    const invoice = await Invoice.create(invoiceData);
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('clientId', 'firstName lastName email');

    res.status(201).json({ success: true, invoice: populatedInvoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update invoice
router.put('/invoices/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clientId createdBy');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== PAYMENT ROUTES ==========

// Get all payments
router.get('/payments', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { clientId, status, startDate, endDate } = req.query;
    let query = {};

    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('invoiceId')
      .populate('processedBy', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .limit(100);

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create payment
router.post('/payments', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      processedBy: req.user._id
    };

    const payment = await Payment.create(paymentData);

    // Update invoice if payment is linked to one
    if (payment.invoiceId) {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.paidAmount += payment.amount;
        invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
        invoice.payments.push({
          paymentId: payment._id,
          amount: payment.amount,
          date: payment.paymentDate,
          method: payment.paymentMethod
        });
        if (invoice.balanceDue <= 0) {
          invoice.status = 'paid';
        }
        await invoice.save();
      }
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('clientId invoiceId processedBy');

    res.status(201).json({ success: true, payment: populatedPayment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== GRANT ROUTES ==========

// Get all grants
router.get('/grants', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status, fundingSource } = req.query;
    let query = {};

    if (status) query.status = status;
    if (fundingSource) query.fundingSource = fundingSource;

    const grants = await Grant.find(query)
      .populate('manager', 'firstName lastName email')
      .sort({ startDate: -1 });

    res.json({ success: true, grants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create grant
router.post('/grants', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const grantData = {
      ...req.body,
      remainingBalance: req.body.amount - (req.body.totalExpended || 0)
    };

    const grant = await Grant.create(grantData);
    const populatedGrant = await Grant.findById(grant._id).populate('manager');

    res.status(201).json({ success: true, grant: populatedGrant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add expenditure to grant
router.post('/grants/:id/expenditures', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const grant = await Grant.findById(req.params.id);
    
    if (!grant) {
      return res.status(404).json({ message: 'Grant not found' });
    }

    grant.expenditures.push(req.body);
    grant.totalExpended += req.body.amount;
    grant.remainingBalance = grant.amount - grant.totalExpended;
    await grant.save();

    res.json({ success: true, grant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DONATION ROUTES ==========

// Get all donations
router.get('/donations', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { donationType, campaign, startDate, endDate } = req.query;
    let query = {};

    if (donationType) query.donationType = donationType;
    if (campaign) query.campaign = campaign;
    if (startDate || endDate) {
      query.donationDate = {};
      if (startDate) query.donationDate.$gte = new Date(startDate);
      if (endDate) query.donationDate.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query)
      .populate('recordedBy', 'firstName lastName')
      .sort({ donationDate: -1 })
      .limit(100);

    res.json({ success: true, donations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create donation
router.post('/donations', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const donationData = {
      ...req.body,
      recordedBy: req.user._id
    };

    const donation = await Donation.create(donationData);
    const populatedDonation = await Donation.findById(donation._id)
      .populate('recordedBy');

    res.status(201).json({ success: true, donation: populatedDonation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Issue tax receipt
router.patch('/donations/:id/tax-receipt', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.taxReceiptIssued = true;
    donation.taxReceiptNumber = req.body.taxReceiptNumber;
    donation.taxReceiptDate = new Date();
    await donation.save();

    res.json({ success: true, donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== BUDGET ROUTES ==========

// Get all budgets
router.get('/budgets', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { fiscalYear, status } = req.query;
    let query = {};

    if (fiscalYear) query.fiscalYear = parseInt(fiscalYear);
    if (status) query.status = status;

    const budgets = await Budget.find(query)
      .populate('createdBy approvedBy', 'firstName lastName')
      .sort({ fiscalYear: -1 });

    res.json({ success: true, budgets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create budget
router.post('/budgets', protect, authorize('admin'), async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      createdBy: req.user._id
    };

    const budget = await Budget.create(budgetData);
    const populatedBudget = await Budget.findById(budget._id)
      .populate('createdBy');

    res.status(201).json({ success: true, budget: populatedBudget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update budget
router.put('/budgets/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy approvedBy');

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== EXPENSE ROUTES ==========

// Get all expenses
router.get('/expenses', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { category, status, budgetId, grantId, startDate, endDate } = req.query;
    let query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (budgetId) query.budgetId = budgetId;
    if (grantId) query.grantId = grantId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy approvedBy', 'firstName lastName')
      .populate('budgetId grantId')
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create expense
router.post('/expenses', protect, authorize('admin', 'staff', 'worker'), async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      submittedBy: req.user._id
    };

    const expense = await Expense.create(expenseData);
    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy budgetId grantId');

    res.status(201).json({ success: true, expense: populatedExpense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve expense
router.patch('/expenses/:id/approve', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.status = 'approved';
    expense.approvedBy = req.user._id;
    expense.approvalDate = new Date();
    await expense.save();

    // Update budget if linked
    if (expense.budgetId) {
      const budget = await Budget.findById(expense.budgetId);
      if (budget) {
        const category = budget.categories.find(c => c.categoryName === expense.category);
        if (category) {
          category.actualAmount += expense.amount;
          category.variance = category.budgetedAmount - category.actualAmount;
        }
        budget.totalActual += expense.amount;
        budget.totalVariance = budget.totalBudgeted - budget.totalActual;
        await budget.save();
      }
    }

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy approvedBy budgetId grantId');

    res.json({ success: true, expense: populatedExpense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== FINANCIAL REPORTS ==========

// Get financial summary
router.get('/reports/summary', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Calculate totals
    const [
      totalRevenue,
      totalExpenses,
      totalDonations,
      totalGrants,
      pendingInvoices
    ] = await Promise.all([
      Payment.aggregate([
        ...(Object.keys(dateFilter).length ? [{ $match: { paymentDate: dateFilter, status: 'completed' } }] : [{ $match: { status: 'completed' } }]),
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        ...(Object.keys(dateFilter).length ? [{ $match: { date: dateFilter, status: 'paid' } }] : [{ $match: { status: 'paid' } }]),
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Donation.aggregate([
        ...(Object.keys(dateFilter).length ? [{ $match: { donationDate: dateFilter } }] : []),
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Grant.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' }, expended: { $sum: '$totalExpended' } } }
      ]),
      Invoice.countDocuments({ status: { $in: ['sent', 'overdue'] } })
    ]);

    const summary = {
      revenue: totalRevenue[0]?.total || 0,
      expenses: totalExpenses[0]?.total || 0,
      netIncome: (totalRevenue[0]?.total || 0) - (totalExpenses[0]?.total || 0),
      donations: totalDonations[0]?.total || 0,
      grants: {
        total: totalGrants[0]?.total || 0,
        expended: totalGrants[0]?.expended || 0,
        remaining: (totalGrants[0]?.total || 0) - (totalGrants[0]?.expended || 0)
      },
      pendingInvoices
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
