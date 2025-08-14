import React, { useState, useEffect } from 'react';
import './styles/CSS/ServerConnectionError.css';

const ServerConnectionError = ({ onRetry }) => {
  const [animationPhase, setAnimationPhase] = useState('reaching');
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    const animationSequence = () => {
      // Animation sequence: reaching -> connecting -> failed -> reaching (loop)
      setTimeout(() => setAnimationPhase('connecting'), 1500);
      setTimeout(() => setAnimationPhase('failed'), 3000);
      setTimeout(() => {
        setAnimationPhase('reaching');
        setAttemptCount(prev => prev + 1);
      }, 4500);
    };

    const interval = setInterval(animationSequence, 6000);
    animationSequence(); // Start immediately

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="server-error-container">
      <div className="error-background">
        <div className="floating-dots">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`dot dot-${i + 1}`}></div>
          ))}
        </div>
      </div>
      
      <div className="error-content">
        <div className="connection-animation">
          <div className="connection-scene">
            {/* Left side - Server/Device */}
            <div className="device left-device">
              <div className="device-body">
                <div className="device-screen">
                  <div className="screen-lines">
                    <div className="line"></div>
                    <div className="line"></div>
                    <div className="line"></div>
                  </div>
                </div>
                <div className="device-base"></div>
              </div>
              <div className="wire-connector left-connector">
                <div className="connector-plug"></div>
                <div className={`wire left-wire ${animationPhase}`}></div>
              </div>
            </div>

            {/* Monkey Character in the middle */}
            <div className={`monkey ${animationPhase}`}>
              <div className="monkey-body">
                {/* Monkey Head */}
                <div className="monkey-head">
                  <div className="face">
                    <div className="face-inner">
                      <div className="eyes">
                        <div className="eye left-eye">
                          <div className="eyeball">
                            <div className="pupil"></div>
                            <div className="light-reflection"></div>
                          </div>
                        </div>
                        <div className="eye right-eye">
                          <div className="eyeball">
                            <div className="pupil"></div>
                            <div className="light-reflection"></div>
                          </div>
                        </div>
                      </div>
                      <div className="nose">
                        <div className="nostril left-nostril"></div>
                        <div className="nostril right-nostril"></div>
                      </div>
                      <div className="mouth">
                        <div className="mouth-inner"></div>
                      </div>
                    </div>
                  </div>
                  <div className="ears">
                    <div className="ear left-ear">
                      <div className="ear-inner"></div>
                    </div>
                    <div className="ear right-ear">
                      <div className="ear-inner"></div>
                    </div>
                  </div>
                </div>
                
                {/* Monkey Body */}
                <div className="monkey-torso"></div>
                
                {/* Monkey Arms */}
                <div className="monkey-arms">
                  <div className="arm left-arm">
                    <div className="upper-arm"></div>
                    <div className="forearm"></div>
                    <div className="hand">
                      <div className="fingers">
                        <div className="finger"></div>
                        <div className="finger"></div>
                        <div className="finger"></div>
                      </div>
                      <div className="thumb"></div>
                    </div>
                  </div>
                  <div className="arm right-arm">
                    <div className="upper-arm"></div>
                    <div className="forearm"></div>
                    <div className="hand">
                      <div className="fingers">
                        <div className="finger"></div>
                        <div className="finger"></div>
                        <div className="finger"></div>
                      </div>
                      <div className="thumb"></div>
                    </div>
                  </div>
                </div>
                
                {/* Monkey Legs */}
                <div className="monkey-legs">
                  <div className="leg left-leg">
                    <div className="thigh"></div>
                    <div className="shin"></div>
                    <div className="foot"></div>
                  </div>
                  <div className="leg right-leg">
                    <div className="thigh"></div>
                    <div className="shin"></div>
                    <div className="foot"></div>
                  </div>
                </div>
                
                {/* Monkey Tail */}
                <div className="monkey-tail">
                  <div className="tail-segment tail-1"></div>
                  <div className="tail-segment tail-2"></div>
                  <div className="tail-segment tail-3"></div>
                  <div className="tail-tip"></div>
                </div>
              </div>
              
              {/* Thought bubbles and expressions */}
              {animationPhase === 'failed' && (
                <div className="thought-bubble">
                  <div className="bubble">
                    <span>🙈</span>
                  </div>
                  <div className="bubble-trail">
                    <div className="small-bubble"></div>
                    <div className="smaller-bubble"></div>
                  </div>
                </div>
              )}
              
              {animationPhase === 'connecting' && (
                <div className="excitement-effects">
                  <div className="sweat-drop"></div>
                  <div className="focus-lines">
                    <div className="focus-line"></div>
                    <div className="focus-line"></div>
                    <div className="focus-line"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Client/Computer */}
            <div className="device right-device">
              <div className="device-body">
                <div className="device-screen">
                  <div className="screen-lines">
                    <div className="line"></div>
                    <div className="line"></div>
                    <div className="line"></div>
                  </div>
                </div>
                <div className="device-base"></div>
              </div>
              <div className="wire-connector right-connector">
                <div className="connector-plug"></div>
                <div className={`wire right-wire ${animationPhase}`}></div>
              </div>
            </div>

            {/* Connection sparks */}
            {animationPhase === 'connecting' && (
              <div className="sparks">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`spark spark-${i + 1}`}></div>
                ))}
              </div>
            )}

            {/* Connection status indicator */}
            <div className={`connection-status ${animationPhase}`}>
              <div className="status-light"></div>
            </div>
          </div>
        </div>

        <div className="error-text">
          <h1 className="error-title">
            <span className="title-icon">🔌</span>
            Connection Lost
          </h1>
          <p className="error-message">
            Oops! We're having trouble connecting to the server.
            <br />
            Our technical team is working hard to restore the connection.
          </p>

        </div>

        <div className="error-actions">
          <button 
            className="retry-button"
            onClick={onRetry || (() => window.location.reload())}
          >
            Try Again
          </button>
          <button 
            className="help-button"
            onClick={() => {
              // You can add help/contact functionality here
              alert('Please contact support if the problem persists.\nEmail: support@yourdomain.com');
            }}
          >
            <span className="button-icon">💬</span>
            Get Help
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerConnectionError;