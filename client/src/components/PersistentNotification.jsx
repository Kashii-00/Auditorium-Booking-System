import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaLock, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const PersistentNotification = ({ 
  autoHideDelay = 7000, // 7 seconds default
  onDismiss = () => {} 
}) => {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Check for notification data in localStorage
    const checkForNotification = () => {
      try {
        const storedNotification = localStorage.getItem('sessionNotification');
        if (storedNotification) {
          const notificationData = JSON.parse(storedNotification);
          
          // Check if notification is not too old (within 30 seconds)
          const now = Date.now();
          const timeDiff = now - notificationData.timestamp;
          
          if (timeDiff < 30000) { // 30 seconds
            setNotification(notificationData);
            setIsVisible(true);
            setTimeRemaining(autoHideDelay / 1000);
            
            // Clear the notification from localStorage
            localStorage.removeItem('sessionNotification');
          } else {
            // Remove old notification
            localStorage.removeItem('sessionNotification');
          }
        }
      } catch (error) {
        console.error('Error reading notification data:', error);
        localStorage.removeItem('sessionNotification');
      }
    };

    // Check immediately and also after a short delay (for redirects)
    checkForNotification();
    const delayedCheck = setTimeout(checkForNotification, 100);

    return () => clearTimeout(delayedCheck);
  }, [autoHideDelay]);

  useEffect(() => {
    if (!isVisible || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleHide();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeRemaining]);

  const handleHide = () => {
    setIsVisible(false);
    setTimeout(() => {
      setNotification(null);
      onDismiss();
    }, 300);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_expired':
        return <FaLock className="text-lg" />;
      case 'error':
        return <FaExclamationCircle className="text-lg" />;
      case 'info':
        return <FaInfoCircle className="text-lg" />;
      default:
        return <FaInfoCircle className="text-lg" />;
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'session_expired':
        return {
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
          borderColor: '#ff5252'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #f44336, #d32f2f)',
          borderColor: '#f44336'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #2196f3, #1976d2)',
          borderColor: '#2196f3'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
          borderColor: '#ff5252'
        };
    }
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-md"
          initial={{ opacity: 0, x: 400, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div
            className="rounded-xl shadow-2xl text-white relative overflow-hidden backdrop-blur-sm"
            style={{
              ...getNotificationStyle(notification.type),
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(255, 107, 107, 0.2)'
            }}
          >
            {/* Progress bar */}
            <motion.div
              className="absolute top-0 left-0 h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoHideDelay / 1000, ease: 'linear' }}
            />

            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <motion.div
                  className="flex-shrink-0 p-2 bg-white/20 rounded-full"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  {getNotificationIcon(notification.type)}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.h3
                    className="text-lg font-semibold mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Session Ended
                  </motion.h3>
                  <motion.p
                    className="text-sm leading-relaxed opacity-95"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {notification.message}
                  </motion.p>
                  
                  {/* Timer and dismiss button */}
                  <motion.div
                    className="flex items-center justify-between mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="text-xs opacity-75">
                      Auto-dismiss in {timeRemaining}s
                    </span>
                    <button
                      onClick={handleHide}
                      className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                </div>

                {/* Close button */}
                <motion.button
                  onClick={handleHide}
                  className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <FaTimes className="text-sm" />
                </motion.button>
              </div>
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/5 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersistentNotification;
