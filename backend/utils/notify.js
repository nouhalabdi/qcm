// utils/notify.js
const Notification = require('../models/Notification');

async function notifyUser(io, userId, { title, body = '', conversationId = null, conversationType = 'system', conversationTitle = '', data = {} }) {
  const notif = await Notification.create({
    userId,
    title,
    body,
    conversationId,
    conversationType,
    conversationTitle,
    data
  });

  if (io) {
    io.to(`user-${userId}`).emit('notification', {
      _id: notif._id,
      title: notif.title,
      body: notif.body,
      conversationId: notif.conversationId,
      conversationType: notif.conversationType,
      conversationTitle: notif.conversationTitle,
      data: notif.data,
      createdAt: notif.createdAt
    });
  }

  return notif;
}

module.exports = { notifyUser };