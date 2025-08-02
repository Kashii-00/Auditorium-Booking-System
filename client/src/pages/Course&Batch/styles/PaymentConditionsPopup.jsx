import React from 'react';
import './PaymentConditionsPopup.css';

const PaymentConditionsPopup = ({ onClose }) => {
  return (
    <div className="payment-popup-overlay" onClick={onClose}>
      <div className="payment-popup-content" onClick={e => e.stopPropagation()}>
        <h2>Payment Conditions</h2>
        <div className="payment-conditions-text">
          <p>1. Full payment must be made before the course commencement date.</p>
          <p>2. Payment can be made in two installments:</p>
          <ul>
            <li>First installment (60%) - At registration</li>
            <li>Second installment (40%) - Before the first assessment</li>
          </ul>
          <p>3. Accepted payment methods:</p>
          <ul>
            <li>Bank transfer</li>
            <li>Credit/Debit cards</li>
            <li>Cash payments at the finance division</li>
          </ul>
          <p>4. Refund policy:</p>
          <ul>
            <li>100% refund - 7 days before course starts</li>
            <li>50% refund - 3-7 days before course starts</li>
            <li>No refund - Less than 3 days notice</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentConditionsPopup;