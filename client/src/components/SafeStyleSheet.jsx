/**
 * Safe StyleSheet Component
 * Provides a secure way to inject CSS styles with CSP nonce support
 */

import { useEffect, useRef } from 'react';
import { CSP } from '../utils/xssProtection.jsx';

/**
 * SafeStyleSheet component for injecting CSS safely
 * @param {Object} props - Component props
 * @param {string} props.css - CSS content to inject
 * @param {string} props.id - Unique ID for the style element
 * @returns {null} This component doesn't render anything
 */
export function SafeStyleSheet({ css, id }) {
  const styleRef = useRef(null);

  useEffect(() => {
    if (!css || typeof css !== 'string') {
      return;
    }

    // Remove existing style element if it exists
    if (styleRef.current) {
      styleRef.current.remove();
      styleRef.current = null;
    }

    // Create new style element
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    
    // Add nonce if available
    const nonce = CSP.getNonce();
    if (nonce) {
      styleElement.nonce = nonce;
    }
    
    // Add ID for identification
    if (id) {
      styleElement.id = id;
    }
    
    // Sanitize CSS content (basic protection against CSS injection)
    const sanitizedCSS = css
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/expression\s*\(/gi, '') // Remove IE expressions
      .replace(/behavior\s*:/gi, '') // Remove IE behaviors
      .replace(/@import/gi, ''); // Remove @import statements
    
    styleElement.textContent = sanitizedCSS;
    
    // Append to head
    document.head.appendChild(styleElement);
    styleRef.current = styleElement;

    // Cleanup function
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [css, id]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook for dynamically injecting CSS
 * @param {string} css - CSS content
 * @param {string} id - Unique identifier
 */
export function useStyleSheet(css, id) {
  const styleRef = useRef(null);

  useEffect(() => {
    if (!css || typeof css !== 'string') {
      return;
    }

    // Remove existing style if it exists
    if (styleRef.current) {
      styleRef.current.remove();
    }

    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    
    const nonce = CSP.getNonce();
    if (nonce) {
      styleElement.nonce = nonce;
    }
    
    if (id) {
      styleElement.id = id;
    }
    
    // Sanitize CSS
    const sanitizedCSS = css
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/@import/gi, '');
    
    styleElement.textContent = sanitizedCSS;
    document.head.appendChild(styleElement);
    styleRef.current = styleElement;

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [css, id]);
}

export default SafeStyleSheet;
