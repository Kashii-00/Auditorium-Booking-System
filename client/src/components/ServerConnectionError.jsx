import React, { Component } from 'react';
import '../components/styles/CSS/ServerConnectionError.css';
import MPMA_LOGO from '../styles/MPMA.png';

class ServerConnectionError extends Component {
  
  render() {
  return (
      <div className="maintenance-container">
                 <div className="logo-container">
           <img 
             src={MPMA_LOGO} 
             alt="Sri Lanka Ports Authority" 
             className="mpma-logo"
           />
                </div>

                 <h1 className="title">Service Temporarily Unavailable</h1>
         
         <p className="description">
           We're experiencing technical difficulties with our server connection. 
           Our team is working to restore service as quickly as possible.
         </p>
        
        <div className="progress-bar">
          <div className="progress"></div>
            </div>


        
                 <div className="footer-info">
           <p className="expected-text">Troubleshooting Tips:</p>
           <p className="expected-date">• CHECK IF THE SERVER IS RUNNING</p>
         </div>
      </div>
    );
  }
}

export default ServerConnectionError
