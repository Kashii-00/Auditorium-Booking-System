import React from 'react';
import './SuccessPopup.css'; // Assuming you have a CSS file for styling

const SuccessPopup = ({ message, onClose }) => {
    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <div className="success-icon">✓</div>
                <h2>Success!</h2>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default SuccessPopup;