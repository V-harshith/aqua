// Input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: email?.toLowerCase().trim()
  };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: password
  };
}

// Phone number validation
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  
  if (!phone) {
    errors.push('Phone number is required');
  } else {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Please enter a valid phone number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: phone?.replace(/[\s\-\(\)]/g, '')
  };
}

// Name validation
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Name is required');
  } else {
    if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      errors.push('Name can only contain letters and spaces');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: name?.trim()
  };
}

// Generic text sanitization
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Service description validation
export function validateServiceDescription(description: string): ValidationResult {
  const errors: string[] = [];
  
  if (!description) {
    errors.push('Description is required');
  } else {
    if (description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    if (description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizeText(description)
  };
}

// User creation validation
export function validateUserCreation(userData: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: string;
}): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate email
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  } else {
    sanitizedData.email = emailValidation.sanitizedValue;
  }
  
  // Validate password
  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  } else {
    sanitizedData.password = passwordValidation.sanitizedValue;
  }
  
  // Validate name
  const nameValidation = validateName(userData.full_name);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  } else {
    sanitizedData.full_name = nameValidation.sanitizedValue;
  }
  
  // Validate phone (optional)
  if (userData.phone) {
    const phoneValidation = validatePhone(userData.phone);
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    } else {
      sanitizedData.phone = phoneValidation.sanitizedValue;
    }
  }
  
  // Validate role
  const validRoles = ['admin', 'customer', 'technician', 'service_manager', 'accounts_manager', 'product_manager', 'driver_manager', 'dept_head'];
  if (!validRoles.includes(userData.role)) {
    errors.push('Invalid role selected');
  } else {
    sanitizedData.role = userData.role;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedData
  };
}

// Service creation validation
export function validateServiceCreation(serviceData: {
  customer_id: string;
  service_type: string;
  description: string;
  priority: string;
}): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate customer_id
  if (!serviceData.customer_id) {
    errors.push('Customer is required');
  } else {
    sanitizedData.customer_id = serviceData.customer_id;
  }
  
  // Validate service_type
  if (!serviceData.service_type) {
    errors.push('Service type is required');
  } else {
    sanitizedData.service_type = sanitizeText(serviceData.service_type);
  }
  
  // Validate description
  const descValidation = validateServiceDescription(serviceData.description);
  if (!descValidation.isValid) {
    errors.push(...descValidation.errors);
  } else {
    sanitizedData.description = descValidation.sanitizedValue;
  }
  
  // Validate priority
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(serviceData.priority)) {
    errors.push('Invalid priority level');
  } else {
    sanitizedData.priority = serviceData.priority;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedData
  };
}