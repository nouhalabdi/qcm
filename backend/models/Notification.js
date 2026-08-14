const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
  conversationType: { type: String, enum: ['direct', 'group', 'system'], default: 'system' },
  conversationTitle: { type: String, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);