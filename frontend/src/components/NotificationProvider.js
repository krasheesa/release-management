import React, { createContext, useContext, useState } from 'react';
import Notification from './Notification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
  };

  const hideNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration) => showNotification(message, 'success', duration);
  const showError = (message, duration) => showNotification(message, 'error', duration);
  const showInfo = (message, duration) => showNotification(message, 'info', duration);

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      showSuccess, 
      showError, 
      showInfo 
    }}>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          isVisible={true}
          onClose={() => hideNotification(notification.id)}
          duration={notification.duration}
        />
      ))}
    </NotificationContext.Provider>
  );
};