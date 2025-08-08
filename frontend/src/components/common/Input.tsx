import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    helperText,
    variant = 'outlined',
    size = 'medium',
    fullWidth = false,
    startIcon,
    endIcon,
    loading = false,
    disabled = false,
    className = '',
    id,
    ...props
  },
  ref
) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);
  
  const containerClasses = [
    'input-container',
    `input-container--${variant}`,
    `input-container--${size}`,
    fullWidth ? 'input-container--full-width' : '',
    hasError ? 'input-container--error' : '',
    disabled ? 'input-container--disabled' : '',
    loading ? 'input-container--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'input',
    startIcon ? 'input--with-start-icon' : '',
    endIcon || loading ? 'input--with-end-icon' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-label__required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {startIcon && (
          <div className="input-icon input-icon--start">
            {startIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          disabled={disabled || loading}
          {...props}
        />
        
        {(endIcon || loading) && (
          <div className="input-icon input-icon--end">
            {loading ? (
              <div className="input-spinner" />
            ) : (
              endIcon
            )}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`input-helper ${hasError ? 'input-helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;