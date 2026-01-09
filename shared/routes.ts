import { z } from 'zod';
import { insertStudentSchema, insertSubscriptionSchema, students, tickets, logs, subscriptions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students',
      responses: {
        200: z.array(z.custom<typeof students.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id',
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students',
      input: insertStudentSchema,
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/students/:id',
      input: insertStudentSchema.partial(),
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  tickets: {
    generate: {
      method: 'POST' as const,
      path: '/api/tickets/generate',
      input: z.object({ date: z.string() }), // YYYY-MM-DD
      responses: {
        201: z.object({ count: z.number(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    scan: {
      method: 'POST' as const,
      path: '/api/tickets/scan',
      input: z.object({ ticketId: z.string(), offline: z.boolean().optional() }),
      responses: {
        200: z.object({
          valid: z.boolean(),
          message: z.string(),
          student: z.object({
            name: z.string(),
            class: z.string(),
            mealsRemaining: z.number(),
          }).optional(),
        }),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/tickets',
      input: z.object({ date: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof tickets.$inferSelect>()),
      },
    },
  },
  reports: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/reports/dashboard',
      responses: {
        200: z.object({
          mealsServedToday: z.number(),
          eligibleStudents: z.number(),
          activeSubscriptions: z.number(),
          recentLogs: z.array(z.custom<typeof logs.$inferSelect>()),
        }),
      },
    },
    eligibility: {
      method: 'GET' as const,
      path: '/api/reports/eligibility',
      input: z.object({ date: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.object({
          studentId: z.string(),
          name: z.string(),
          grade: z.string(),
          class: z.string(),
          planType: z.string(),
          mealsRemaining: z.number(),
          status: z.string(),
          usedToday: z.boolean(),
          usedAt: z.string().optional(),
        })),
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/reports/export',
      input: z.object({ date: z.string().optional() }).optional(),
      responses: {
        200: z.string(), // CSV Content
      },
    },
  },
  webhooks: {
    quickbooks: {
      method: 'POST' as const,
      path: '/api/webhooks/quickbooks',
      input: z.object({
        studentId: z.string(),
        productType: z.string(),
        amount: z.number(),
        transactionId: z.string(),
        grade: z.string().optional(),
        class: z.string().optional(),
        description: z.string().optional(),
        serviceDate: z.string().optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  integrations: {
    list: {
      method: 'GET' as const,
      path: '/api/integrations',
      responses: {
        200: z.array(z.custom<any>()), // Integration type
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/integrations/:name',
      input: z.object({
        status: z.string().optional(),
        settings: z.any().optional(),
      }),
      responses: {
        200: z.custom<any>(),
      },
    },
    logs: {
      method: 'GET' as const,
      path: '/api/integrations/logs',
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ScanResponse = z.infer<typeof api.tickets.scan.responses[200]>;
