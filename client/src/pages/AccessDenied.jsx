import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AccessDenied.css';

const AccessDenied = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/login');
  };
  
  return (
    <div className="access-denied-container">
      <h2>⚠️ Access Denied</h2>
      <p>You don't have permission to access this page.</p>
      <button 
        onClick={handleClick}
        className="access-denied-button"
      >
        Return to Home
      </button>
    </div>
  );
};

export default AccessDenied;