import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import '../styles/SuccessNotification.css';

const SuccessNotification = ({ message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`success-notification ${isVisible ? 'show' : 'hide'}`}>
      <div className="notification-content">
        <FaCheckCircle className="notification-icon" />
        <p className="notification-message">{message}</p>
      </div>
      <button 
        className="notification-close" 
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default SuccessNotification;
