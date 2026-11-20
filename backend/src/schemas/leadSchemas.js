const { z } = require('zod');
const { SOURCES, STATUSES } = require('../db/schema');

const phoneValidator = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .refine(
    (val) => {
      if (!/^[\d\s+\-]+$/.test(val)) return false;
      const digits = val.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    },
    {
      message: 'Phone must contain 7 to 15 digits (allowing +, spaces, dashes)',
    }
  );

const createLeadSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be between 2 and 100 characters')
    .max(100, 'Name must be between 2 and 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: phoneValidator,
  company: z
    .string({ required_error: 'Company is required' })
    .trim()
    .min(1, 'Company is required')
    .max(100, 'Company cannot exceed 100 characters'),
  source: z.enum(SOURCES, {
    errorMap: () => ({
      message: `Source must be one of: ${SOURCES.join(', ')}`,
    }),
  }),
  status: z.enum(STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${STATUSES.join(', ')}`,
    }),
  }),
});

// For update, allow partial or full payload, but at least one field or full lead
const updateLeadSchema = createLeadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

const ALLOWED_SORT_COLUMNS = [
  'id',
  'name',
  'email',
  'phone',
  'company',
  'source',
  'status',
  'created_at',
  'updated_at',
];

const listLeadsQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  status: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || STATUSES.includes(val), {
      message: `Status must be one of: ${STATUSES.join(', ')}`,
    })
    .default(''),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || ALLOWED_SORT_COLUMNS.includes(val), {
      message: `sortBy must be one of: ${ALLOWED_SORT_COLUMNS.join(', ')}`,
    })
    .default('created_at'),
  order: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || ['asc', 'desc', 'ASC', 'DESC'].includes(val), {
      message: "order must be 'asc' or 'desc'",
    })
    .default('desc'),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  ALLOWED_SORT_COLUMNS,
};
