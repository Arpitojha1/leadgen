export const SOURCES = [
  'Website',
  'Referral',
  'LinkedIn',
  'Cold Call',
  'Event',
  'Other',
];

export const STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Lost',
];

export const STATUS_COLORS = {
  New: {
    bg: '#eff6ff',
    text: '#1d4ed8',
    border: '#bfdbfe',
    dot: '#3b82f6',
  },
  Contacted: {
    bg: '#fefce8',
    text: '#a16207',
    border: '#fef08a',
    dot: '#eab308',
  },
  Qualified: {
    bg: '#f0fdf4',
    text: '#15803d',
    border: '#bbf7d0',
    dot: '#22c55e',
  },
  Lost: {
    bg: '#fef2f2',
    text: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444',
  },
};

export function validateLeadForm(values) {
  const errors = {};

  // Name validation: 2-100 chars
  const name = (values.name || '').trim();
  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  // Email validation
  const email = (values.email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation: 7-15 digits, allowing +, spaces, dashes
  const phone = (values.phone || '').trim();
  if (!phone) {
    errors.phone = 'Phone number is required';
  } else if (!/^[\d\s+\-]+$/.test(phone)) {
    errors.phone = 'Phone may only contain digits, spaces, +, and -';
  } else {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      errors.phone = 'Phone must contain between 7 and 15 digits';
    }
  }

  // Company validation
  const company = (values.company || '').trim();
  if (!company) {
    errors.company = 'Company is required';
  } else if (company.length > 100) {
    errors.company = 'Company cannot exceed 100 characters';
  }

  // Source validation
  if (!values.source || !SOURCES.includes(values.source)) {
    errors.source = `Source must be one of: ${SOURCES.join(', ')}`;
  }

  // Status validation
  if (!values.status || !STATUSES.includes(values.status)) {
    errors.status = `Status must be one of: ${STATUSES.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
