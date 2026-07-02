/**
 * Accessibility utilities for WCAG compliance
 */

/**
 * Generate accessible IDs for form elements
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create accessible label for form inputs
 */
export function createLabel(id, labelText, required = false) {
  return {
    id,
    htmlFor: id,
    children: required ? `${labelText} *` : labelText
  };
}

/**
 * Generate ARIA attributes for accessibility
 */
export function getAriaAttributes({ 
  role = 'region', 
  label = '', 
  describedby = '',
  live = null,
  atomic = false,
  relevant = 'additions text',
  hidden = false,
  expanded = null,
  controls = '',
  labelledby = '',
  current = null,
  roledescription = '',
  haspopup = null,
  pressed = null,
  selected = null,
  checked = null,
  disabled = false,
  readonly = false,
  required = false,
  invalid = false
}) {
  const attributes = {};
  
  if (role) attributes['role'] = role;
  if (label) attributes['aria-label'] = label;
  if (describedby) attributes['aria-describedby'] = describedby;
  if (live) attributes['aria-live'] = live;
  if (atomic) attributes['aria-atomic'] = atomic;
  if (relevant) attributes['aria-relevant'] = relevant;
  if (hidden) attributes['aria-hidden'] = hidden;
  if (expanded !== null) attributes['aria-expanded'] = expanded;
  if (controls) attributes['aria-controls'] = controls;
  if (labelledby) attributes['aria-labelledby'] = labelledby;
  if (current !== null) attributes['aria-current'] = current;
  if (roledescription) attributes['aria-roledescription'] = roledescription;
  if (haspopup !== null) attributes['aria-haspopup'] = haspopup;
  if (pressed !== null) attributes['aria-pressed'] = pressed;
  if (selected !== null) attributes['aria-selected'] = selected;
  if (checked !== null) attributes['aria-checked'] = checked;
  if (disabled) attributes['aria-disabled'] = disabled;
  if (readonly) attributes['aria-readonly'] = readonly;
  if (required) attributes['aria-required'] = required;
  if (invalid) attributes['aria-invalid'] = invalid;
  
  return attributes;
}

/**
 * Check if color contrast meets WCAG standards
 */
export function checkColorContrast(foreground, background, level = 'AA') {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  
  // Calculate relative luminance
  const getLuminance = (r, g, b) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  // Calculate contrast ratio
  const getContrastRatio = (lum1, lum2) => {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };
  
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  const lum1 = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const lum2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const contrastRatio = getContrastRatio(lum1, lum2);
  
  // WCAG contrast requirements
  const requirements = {
    'AA': 4.5,  // Normal text
    'AAA': 7.0, // Normal text
    'AA-large': 3.0, // Large text (18.66px+)
    'AAA-large': 4.5 // Large text (18.66px+)
  };
  
  return contrastRatio >= requirements[level];
}

/**
 * Generate accessible error messages
 */
export function getErrorMessage(type, fieldName = '') {
  const messages = {
    required: `${fieldName || 'This field'} is required`,
    invalid: `${fieldName || 'This value'} is invalid`,
    minLength: `${fieldName || 'Input'} must be at least ${type.min} characters`,
    maxLength: `${fieldName || 'Input'} must be less than ${type.max} characters`,
    min: `${fieldName || 'Value'} must be at least ${type.min}`,
    max: `${fieldName || 'Value'} must be less than ${type.max}`,
    pattern: `${fieldName || 'Input'} does not match the required pattern`,
    email: 'Please enter a valid email address',
    number: 'Please enter a valid number',
    date: 'Please enter a valid date',
    url: 'Please enter a valid URL',
    password: 'Password must meet complexity requirements',
    confirmPassword: 'Passwords do not match'
  };
  
  return messages[type] || 'An error occurred';
}

/**
 * Create accessible form validation messages
 */
export function createValidationMessage(errors = []) {
  if (!errors.length) return '';
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  return `${errors.join(', ')}. Please correct these issues.`;
}

/**
 * Generate accessible table headers
 */
export function createTableHeaders(columns = []) {
  return columns.map(column => ({
    key: column.key || column,
    header: column.header || column,
    sortable: column.sortable || false,
    ariaSort: column.ariaSort || null
  }));
}

/**
 * Create accessible pagination controls
 */
export function createPaginationAria(currentPage, totalPages, itemsPerPage, totalItems) {
  return {
    current: {
      'aria-label': `Page ${currentPage} of ${totalPages}`,
      'aria-current': currentPage === currentPage ? 'page' : undefined
    },
    previous: {
      'aria-label': `Go to previous page, page ${currentPage - 1}`,
      'aria-disabled': currentPage <= 1
    },
    next: {
      'aria-label': `Go to next page, page ${currentPage + 1}`,
      'aria-disabled': currentPage >= totalPages
    },
    first: {
      'aria-label': `Go to first page`,
      'aria-disabled': currentPage <= 1
    },
    last: {
      'aria-label': `Go to last page`,
      'aria-disabled': currentPage >= totalPages
    },
    info: {
      'aria-live': 'polite',
      'aria-atomic': 'true'
    }
  };
}

/**
 * Create accessible modal dialog attributes
 */
export function getModalAriaAttributes({ 
  isOpen = false, 
  title = '', 
  description = '',
  onClose = null 
}) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': title ? 'modal-title' : undefined,
    'aria-describedby': description ? 'modal-description' : undefined,
    'aria-hidden': !isOpen,
    tabIndex: -1
  };
}

/**
 * Create accessible button attributes
 */
export function getButtonAriaAttributes({ 
  disabled = false,
  loading = false,
  type = 'button',
  label = '',
  describedby = '',
  pressed = null,
  expanded = null,
  haspopup = null
}) {
  return {
    'aria-label': label,
    'aria-describedby': describedby,
    'aria-disabled': disabled || loading,
    'aria-pressed': pressed,
    'aria-expanded': expanded,
    'aria-haspopup': haspopup,
    'aria-busy': loading
  };
}

/**
 * Create accessible input attributes
 */
export function getInputAriaAttributes({ 
  id = '',
  label = '',
  type = 'text',
  required = false,
  invalid = false,
  disabled = false,
  readonly = false,
  describedby = '',
  value = '',
  min = null,
  max = null,
  step = null
}) {
  return {
    'aria-label': label,
    'aria-labelledby': label ? `${id}-label` : undefined,
    'aria-describedby': describedby || (invalid ? `${id}-error` : undefined),
    'aria-required': required,
    'aria-invalid': invalid,
    'aria-disabled': disabled,
    'aria-readonly': readonly,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuestep': step,
    'aria-valuenow': type === 'range' ? value : undefined
  };
}

/**
 * Screen reader only text (visually hidden but accessible)
 */
export function srOnlyText(text = '') {
  return {
    className: 'sr-only',
    children: text
  };
}

/**
 * Check if element is focusable
 */
export function isFocusable(element) {
  if (!element) return false;
  
  const focusableElements = [
    'A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'DETAILS',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]:not([contenteditable="false"])'
  ];
  
  return focusableElements.some(selector => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container) {
  if (!container) return [];
  
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])'
  ));
}

/**
 * Create a focus trap for modals and dialogs
 */
export function createFocusTrap(container, firstFocusableSelector = null) {
  if (!container) return null;
  
  const focusableElements = getFocusableElements(container);
  const firstElement = firstFocusableSelector 
    ? container.querySelector(firstFocusableSelector) 
    : focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  return {
    trap: (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    },
    firstElement,
    lastElement
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message, politeness = 'polite') {
  // Remove existing announcements
  const existingAnnouncer = document.getElementById('aria-live-announcer');
  if (existingAnnouncer) {
    existingAnnouncer.remove();
  }
  
  // Create new announcer
  const announcer = document.createElement('div');
  announcer.id = 'aria-live-announcer';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', politeness);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove after announcement
  setTimeout(() => {
    announcer.remove();
  }, 1000);
}

export default {
  generateId,
  createLabel,
  getAriaAttributes,
  checkColorContrast,
  getErrorMessage,
  createValidationMessage,
  createTableHeaders,
  createPaginationAria,
  getModalAriaAttributes,
  getButtonAriaAttributes,
  getInputAriaAttributes,
  srOnlyText,
  isFocusable,
  getFocusableElements,
  createFocusTrap,
  announceToScreenReader
};
