const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { InventoryItem, InventoryTransaction, EquipmentCheckout, PurchaseOrder } = require('../models/Inventory');

// ==================== INVENTORY ITEMS ====================

// Get all inventory items
router.get('/items', protect, async (req, res) => {
  try {
    const { category, status, search, lowStock } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let items = await InventoryItem.find(filter).sort({ itemName: 1 }).limit(100);
    
    // Filter by low stock if requested
    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.minimumStock);
    }
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get item by ID
router.get('/items/:id', protect, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create item
router.post('/items', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const item = new InventoryItem(req.body);
    await item.save();
    
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update item
router.put('/items/:id', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete item
router.delete('/items/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/items/alerts/low-stock', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const items = await InventoryItem.find({ status: 'active' });
    const lowStockItems = items.filter(item => item.isLowStock);
    
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSACTIONS ====================

// Get transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const { itemId, transactionType, startDate, endDate } = req.query;
    const filter = {};
    
    if (itemId) filter.itemId = itemId;
    if (transactionType) filter.transactionType = transactionType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await InventoryTransaction.find(filter)
      .populate('itemId', 'itemName itemCode')
      .populate('userId', 'firstName lastName')
      .populate('recipientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record transaction
router.post('/transactions', protect, authorize(['admin', 'staff', 'worker']), async (req, res) => {
  try {
    const { itemId, transactionType, quantity, reason, notes, cost } = req.body;
    
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const previousQuantity = item.quantity;
    let newQuantity = previousQuantity;
    
    // Calculate new quantity based on transaction type
    switch (transactionType) {
      case 'purchase':
      case 'checkin':
      case 'donation':
        newQuantity = previousQuantity + quantity;
        break;
      case 'checkout':
      case 'disposal':
        newQuantity = previousQuantity - quantity;
        break;
      case 'adjustment':
        newQuantity = quantity; // Direct set
        break;
    }
    
    // Validate sufficient quantity for checkouts
    if ((transactionType === 'checkout' || transactionType === 'disposal') && newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }
    
    // Create transaction
    const transaction = new InventoryTransaction({
      itemId,
      transactionType,
      quantity,
      previousQuantity,
      newQuantity,
      userId: req.user.userId,
      reason,
      notes,
      cost,
      ...req.body
    });
    
    await transaction.save();
    
    // Update item quantity
    item.quantity = newQuantity;
    if (newQuantity === 0) {
      item.status = 'out_of_stock';
    } else if (item.status === 'out_of_stock') {
      item.status = 'active';
    }
    await item.save();
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== EQUIPMENT CHECKOUT ====================

// Get checkouts
router.get('/checkouts', protect, async (req, res) => {
  try {
    const { status, userId, itemId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (itemId) filter.itemId = itemId;
    
    // Regular users can only see their own checkouts
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      filter.userId = req.user.userId;
    }
    
    const checkouts = await EquipmentCheckout.find(filter)
      .populate('itemId', 'itemName itemCode category')
      .populate('userId', 'firstName lastName email')
      .populate('checkedOutBy', 'firstName lastName')
      .sort({ checkoutDate: -1 })
      .limit(100);
    
    res.json(checkouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checkout equipment
router.post('/checkouts', protect, async (req, res) => {
  try {
    const { itemId, userId, expectedReturnDate, checkoutNotes } = req.body;
    
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.quantity < 1) {
      return res.status(400).json({ error: 'Item not available' });
    }
    
    // Create checkout
    const checkout = new EquipmentCheckout({
      itemId,
      userId: userId || req.user.userId,
      checkedOutBy: req.user.userId,
      expectedReturnDate,
      checkoutNotes,
      status: 'checked_out'
    });
    
    await checkout.save();
    
    // Create transaction and update quantity
    const transaction = new InventoryTransaction({
      itemId,
      transactionType: 'checkout',
      quantity: 1,
      previousQuantity: item.quantity,
      newQuantity: item.quantity - 1,
      userId: req.user.userId,
      recipientId: userId,
      notes: `Equipment checkout: ${checkout._id}`
    });
    
    await transaction.save();
    
    item.quantity -= 1;
    if (item.quantity === 0) {
      item.status = 'out_of_stock';
    }
    await item.save();
    
    res.status(201).json(checkout);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Return equipment
router.patch('/checkouts/:id/return', protect, async (req, res) => {
  try {
    const { returnCondition, returnNotes, damageReport } = req.body;
    
    const checkout = await EquipmentCheckout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }
    
    if (checkout.status !== 'checked_out') {
      return res.status(400).json({ error: 'Item already returned' });
    }
    
    checkout.actualReturnDate = new Date();
    checkout.status = 'returned';
    checkout.condition.returnCondition = returnCondition;
    checkout.returnNotes = returnNotes;
    
    if (damageReport) {
      checkout.damageReport = damageReport;
      if (returnCondition === 'damaged' || returnCondition === 'unusable') {
        checkout.status = 'damaged';
      }
    }
    
    await checkout.save();
    
    // Update item quantity
    const item = await InventoryItem.findById(checkout.itemId);
    if (item) {
      const transaction = new InventoryTransaction({
        itemId: checkout.itemId,
        transactionType: 'checkin',
        quantity: 1,
        previousQuantity: item.quantity,
        newQuantity: item.quantity + 1,
        userId: req.user.userId,
        notes: `Equipment return: ${checkout._id}`
      });
      
      await transaction.save();
      
      item.quantity += 1;
      if (item.status === 'out_of_stock') {
        item.status = 'active';
      }
      await item.save();
    }
    
    res.json(checkout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue checkouts
router.get('/checkouts/alerts/overdue', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const checkouts = await EquipmentCheckout.find({
      status: 'checked_out',
      expectedReturnDate: { $lt: new Date() }
    })
      .populate('itemId', 'itemName itemCode')
      .populate('userId', 'firstName lastName email')
      .sort({ expectedReturnDate: 1 });
    
    res.json(checkouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PURCHASE ORDERS ====================

// Get purchase orders
router.get('/purchase-orders', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    const orders = await PurchaseOrder.find(filter)
      .populate('orderedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ orderDate: -1 })
      .limit(100);
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase order
router.post('/purchase-orders', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      orderedBy: req.user.userId
    };
    
    const order = new PurchaseOrder(orderData);
    await order.save();
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update purchase order
router.put('/purchase-orders/:id', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve purchase order
router.patch('/purchase-orders/:id/approve', protect, authorize(['admin']), async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = 'approved';
    order.approvedBy = req.user.userId;
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Receive purchase order
router.patch('/purchase-orders/:id/receive', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = 'received';
    order.actualDeliveryDate = new Date();
    order.receivedBy = req.user.userId;
    await order.save();
    
    // Update inventory quantities
    for (const item of order.items) {
      if (item.itemId) {
        const inventoryItem = await InventoryItem.findById(item.itemId);
        if (inventoryItem) {
          const transaction = new InventoryTransaction({
            itemId: item.itemId,
            transactionType: 'purchase',
            quantity: item.quantity,
            previousQuantity: inventoryItem.quantity,
            newQuantity: inventoryItem.quantity + item.quantity,
            userId: req.user.userId,
            cost: item.totalPrice,
            notes: `Purchase order received: ${order.orderNumber}`
          });
          
          await transaction.save();
          
          inventoryItem.quantity += item.quantity;
          if (inventoryItem.status === 'out_of_stock') {
            inventoryItem.status = 'active';
          }
          await inventoryItem.save();
        }
      }
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
