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
    // Check for notification data from URL parameters
    const checkForNotification = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const reason = urlParams.get('reason');
        
        if (reason) {
          let notificationData = null;
          
          // Map URL reason to notification data
          switch (reason) {
            case 'session_expired':
              notificationData = {
                type: 'session_expired',
                message: 'You\'ve been logged out because your account was accessed from another device.',
                timestamp: Date.now()
              };
              break;
            case 'inactivity':
              notificationData = {
                type: 'info',
                message: 'You were logged out due to 10 minutes of inactivity.',
                timestamp: Date.now()
              };
              break;
            case 'user_logout':
              notificationData = {
                type: 'info',
                message: 'You have been successfully logged out.',
                timestamp: Date.now()
              };
              break;
          }
          
          if (notificationData) {
            setNotification(notificationData);
            setIsVisible(true);
            setTimeRemaining(autoHideDelay / 1000);
            
            // Clean up URL parameter immediately to prevent re-showing
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('reason');
            window.history.replaceState({}, '', newUrl);
          }
        }
      } catch (error) {
        console.error('Error reading URL parameters:', error);
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
          className="fixed top-4 right-4 z-50"
          initial={{ opacity: 0, x: 400, y: -50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 400, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            duration: 0.6 
          }}
        >
          <motion.div
            className="relative overflow-hidden backdrop-blur-md"
            style={{
              background: notification.type === 'session_expired' 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))' 
                : notification.type === 'info' && notification.message.includes('inactivity')
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95))'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95))',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              minWidth: '320px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Animated background particles */}
            <motion.div
              className="absolute inset-0 opacity-20"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-2 right-8 w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute top-8 right-4 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-white rounded-full"></div>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="absolute top-0 left-0 h-1 bg-white/30 rounded-t-2xl"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoHideDelay / 1000, ease: 'linear' }}
            />

            {/* Glowing edge effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)`,
                transform: 'translateX(-100%)'
              }}
              animate={{
                transform: 'translateX(100%)'
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />

            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* Animated Icon */}
                <motion.div
                  className="flex-shrink-0 relative"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2, 
                    type: "spring", 
                    stiffness: 300,
                    damping: 15
                  }}
                >
                  <motion.div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white relative"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    animate={{
                      boxShadow: [
                        '0 0 0 0px rgba(255, 255, 255, 0.4)',
                        '0 0 0 8px rgba(255, 255, 255, 0)',
                        '0 0 0 0px rgba(255, 255, 255, 0)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  >
                    {notification.type === 'session_expired' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        🔒
                      </motion.div>
                    ) : notification.type === 'info' && notification.message.includes('inactivity') ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        ⏰
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        ✅
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {notification.type === 'session_expired' 
                        ? '🔐 Session Ended' 
                        : notification.type === 'info' && notification.message.includes('inactivity')
                        ? '💤 Auto Logout'
                        : '👋 Goodbye!'
                      }
                    </h3>
                    <motion.p
                      className="text-white/90 text-xs leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {notification.type === 'session_expired' 
                        ? 'Logged in from another device' 
                        : notification.type === 'info' && notification.message.includes('inactivity')
                        ? 'Inactive for too long'
                        : 'Successfully logged out'
                      }
                    </motion.p>
                  </motion.div>
                </div>

                {/* Close button */}
                <motion.button
                  onClick={handleHide}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 text-white/80 hover:text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    background: 'rgba(255, 255, 255, 0.2)',
                    rotate: 90
                  }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <FaTimes className="text-xs" />
                </motion.button>
              </div>
              
              {/* Timer with pulse animation */}
              <motion.div
                className="mt-3 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)'
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Auto-dismiss in {timeRemaining}s
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersistentNotification;
