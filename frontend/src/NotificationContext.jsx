import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // إضافة إشعار جديد
  const addNotification = (notif) => {
    setNotifications((prev) => {
      // نتأكد من عدم وجود تكرار (نفس المعرف)
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  };

  // حذف إشعار واحد
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  // مسح جميع الإشعارات (اختياري)
  const clearNotifications = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};