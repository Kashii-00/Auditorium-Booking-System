/**
 * Secure Form Components
 * React components with built-in XSS protection and validation
 */

import React, { useState, useCallback } from 'react';
import { sanitizeFormData, validateEmail, validatePhone, safeRender } from '../utils/xssProtection.jsx';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Secure Input component with built-in XSS protection
 */
export function SecureInput({ 
  value, 
  onChange, 
  type = 'text', 
  maxLength = 255,
  allowBasicFormatting = false,
  className = '',
  ...props 
}) {
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value;
    
    // Sanitize input based on type
    let sanitizedValue = rawValue;
    
    if (type === 'email') {
      const { sanitized } = validateEmail(rawValue);
      sanitizedValue = sanitized;
    } else if (type === 'tel') {
      const { sanitized } = validatePhone(rawValue);
      sanitizedValue = sanitized;
    } else {
      // General text sanitization
      sanitizedValue = rawValue.substring(0, maxLength);
    }
    
    // Create new event with sanitized value
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue
      }
    };
    
    onChange(sanitizedEvent);
  }, [onChange, type, maxLength]);

  return (
    <Input
      type={type}
      value={value || ''}
      onChange={handleChange}
      maxLength={maxLength}
      className={className}
      {...props}
    />
  );
}

/**
 * Secure Textarea component with XSS protection
 */
export function SecureTextarea({ 
  value, 
  onChange, 
  maxLength = 1000,
  allowBasicFormatting = false,
  className = '',
  ...props 
}) {
  const handleChange = useCallback((e) => {
    let sanitizedValue = e.target.value;
    
    // Limit length
    if (sanitizedValue.length > maxLength) {
      sanitizedValue = sanitizedValue.substring(0, maxLength);
    }
    
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue
      }
    };
    
    onChange(sanitizedEvent);
  }, [onChange, maxLength]);

  return (
    <Textarea
      value={value || ''}
      onChange={handleChange}
      maxLength={maxLength}
      className={className}
      {...props}
    />
  );
}

/**
 * Secure display component for user-generated content
 */
export function SecureDisplay({ 
  content, 
  allowHTML = false, 
  truncate = null,
  className = '',
  ...props 
}) {
  const safeContent = safeRender(content, { allowHTML, truncate });
  
  if (allowHTML) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: safeContent }}
        {...props}
      />
    );
  }
  
  return (
    <div className={className} {...props}>
      {safeContent}
    </div>
  );
}

/**
 * Form validation hook with XSS protection
 */
export function useSecureForm(initialData = {}, validationRules = {}) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return `${rules.label || name} is required`;
    }

    // Email validation
    if (rules.type === 'email' && value) {
      const { isValid, error } = validateEmail(value);
      if (!isValid) return error;
    }

    // Phone validation
    if (rules.type === 'phone' && value) {
      const { isValid, error } = validatePhone(value);
      if (!isValid) return error;
    }

    // Length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return `${rules.label || name} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `${rules.label || name} must not exceed ${rules.maxLength} characters`;
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      return rules.validate(value);
    }

    return null;
  }, [validationRules]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validationRules, validateField]);

  const sanitizeAndSubmit = useCallback(async (onSubmit) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Sanitize form data
      const sanitizedData = sanitizeFormData(formData);
      
      // Call submit handler with sanitized data
      await onSubmit(sanitizedData);
      
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, validateForm]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validateField,
    validateForm,
    sanitizeAndSubmit,
    resetForm,
    setFormData
  };
}

/**
 * Secure form wrapper component
 */
export function SecureForm({ 
  children, 
  onSubmit, 
  validationRules = {},
  className = '',
  ...props 
}) {
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(e);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    }
  }, [onSubmit]);

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      {submitError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      {submitSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Form submitted successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {children}
    </form>
  );
}

/**
 * Field wrapper with label and error display
 */
export function SecureField({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '' 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

export default {
  SecureInput,
  SecureTextarea,
  SecureDisplay,
  SecureForm,
  SecureField,
  useSecureForm
};
