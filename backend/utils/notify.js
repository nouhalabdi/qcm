const Notification = require('../models/Notification');

/**
 * كيخزن الإشعار فـ قاعدة البيانات (باش الطالب يلقاه كي يعاود يدخل حتى لو كان
 * غير متصل وقت الإرسال) وفـ نفس الوقت كيبعتو حي عبر Socket.io إذا كان متصل دابا.
 */
async function notifyUser(io, userId, { title, body = '', conversationId = null, conversationType = 'system', conversationTitle = '' }) {
  const notif = await Notification.create({ userId, title, body, conversationId, conversationType, conversationTitle });

  if (io) {
    io.to(`user-${userId}`).emit('notification', {
      _id: notif._id,
      title: notif.title,
      body: notif.body,
      conversationId: notif.conversationId,
      conversationType: notif.conversationType,
      conversationTitle: notif.conversationTitle,
      createdAt: notif.createdAt
    });
  }

  return notif;
}

module.exports = { notifyUser };