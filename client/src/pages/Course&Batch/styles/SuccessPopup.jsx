import React, { useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import './SuccessPopup.css';

const SuccessPopup = ({ message, onClose }) => {
  useEffect(() => {
    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <div className="success-icon">
          <FaCheckCircle size={30} color="#ffffff" />
        </div>
        <h3>Success!</h3>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default SuccessPopup;