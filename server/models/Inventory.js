const mongoose = require('mongoose');

// Inventory Item Schema
const inventoryItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  itemCode: { type: String, unique: true, sparse: true },
  category: {
    type: String,
    enum: ['supplies', 'equipment', 'medication', 'food', 'clothing', 'furniture', 'electronics', 'hygiene', 'other'],
    required: true
  },
  description: String,
  quantity: { type: Number, required: true, default: 0 },
  unit: {
    type: String,
    enum: ['piece', 'box', 'case', 'pack', 'bottle', 'bag', 'liter', 'kilogram', 'pound', 'gallon', 'each'],
    default: 'piece'
  },
  minimumStock: { type: Number, default: 0 },
  maximumStock: Number,
  reorderPoint: Number,
  location: {
    building: String,
    room: String,
    shelf: String,
    bin: String
  },
  supplier: {
    name: String,
    contactPerson: String,
    phone: String,
    email: String
  },
  purchaseInfo: {
    unitCost: Number,
    lastPurchaseDate: Date,
    lastPurchasePrice: Number,
    preferredVendor: String
  },
  barcodes: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'active'
  },
  expirationDate: Date,
  images: [String],
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
inventoryItemSchema.index({ category: 1, status: 1 });
inventoryItemSchema.index({ barcodes: 1 });
inventoryItemSchema.index({ quantity: 1 });

// Virtuals
inventoryItemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minimumStock;
});

inventoryItemSchema.virtual('isOutOfStock').get(function() {
  return this.quantity === 0;
});

inventoryItemSchema.virtual('needsReorder').get(function() {
  return this.reorderPoint && this.quantity <= this.reorderPoint;
});

// Inventory Transaction Schema
const inventoryTransactionSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  transactionType: {
    type: String,
    enum: ['purchase', 'checkout', 'checkin', 'adjustment', 'transfer', 'disposal', 'donation'],
    required: true
  },
  quantity: { type: Number, required: true },
  previousQuantity: Number,
  newQuantity: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromLocation: {
    building: String,
    room: String
  },
  toLocation: {
    building: String,
    room: String
  },
  cost: Number,
  reason: String,
  notes: String,
  referenceNumber: String,
  attachments: [{
    filename: String,
    url: String
  }],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
inventoryTransactionSchema.index({ itemId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ userId: 1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ createdAt: -1 });

// Equipment Checkout Schema
const equipmentCheckoutSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkoutDate: { type: Date, required: true, default: Date.now },
  expectedReturnDate: Date,
  actualReturnDate: Date,
  status: {
    type: String,
    enum: ['checked_out', 'returned', 'overdue', 'lost', 'damaged'],
    default: 'checked_out'
  },
  condition: {
    checkoutCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    returnCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'unusable']
    }
  },
  checkoutNotes: String,
  returnNotes: String,
  damageReport: {
    reported: { type: Boolean, default: false },
    description: String,
    photos: [String],
    cost: Number
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
equipmentCheckoutSchema.index({ itemId: 1, status: 1 });
equipmentCheckoutSchema.index({ userId: 1 });
equipmentCheckoutSchema.index({ status: 1 });
equipmentCheckoutSchema.index({ expectedReturnDate: 1 });

// Virtuals
equipmentCheckoutSchema.virtual('isOverdue').get(function() {
  return this.expectedReturnDate && this.expectedReturnDate < new Date() && this.status === 'checked_out';
});

equipmentCheckoutSchema.virtual('daysOut').get(function() {
  const end = this.actualReturnDate || new Date();
  const days = Math.floor((end - this.checkoutDate) / (1000 * 60 * 60 * 24));
  return days;
});

// Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  supplierId: String,
  supplierName: String,
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    itemName: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  totalAmount: Number,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'ordered', 'received', 'cancelled'],
    default: 'draft'
  },
  orderDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  attachments: [{
    filename: String,
    url: String,
    type: String // invoice, receipt, packing_slip
  }],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
const EquipmentCheckout = mongoose.model('EquipmentCheckout', equipmentCheckoutSchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = { InventoryItem, InventoryTransaction, EquipmentCheckout, PurchaseOrder };
