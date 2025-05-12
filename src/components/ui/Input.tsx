'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    helperText,
    error,
    className = '',
    fullWidth = true,
    id,
    ...props
  }, ref) => {
  // Generate a unique ID if one isn't provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`
          block rounded-md border-gray-300 shadow-sm 
          focus:border-blue-500 focus:ring-blue-500 sm:text-sm
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${fullWidth ? 'w-full' : ''}
          px-3 py-2 border
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-description` : undefined}
        {...props}
      />
      {helperText && !error && (
        <p 
          id={`${inputId}-description`} 
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
      {error && (
        <p 
          id={`${inputId}-error`} 
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;