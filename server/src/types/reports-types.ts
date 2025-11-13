import { z } from "zod";

const REPORT_CATEGORY_VALUES = [
  "Communication",
  "Mentorship",
  "Training",
  "Resources",
] as const;
export const reportCategorySchema = z.enum(REPORT_CATEGORY_VALUES);
export type ReportCategory = z.infer<typeof reportCategorySchema>;

export const getReportsSchema = z.object({
  name: z.string(),
});

export const assignReportSchema = z.object({
  reportId: z.uuid(),
  assigneeId: z.uuid(),
  assignedBy: z.uuid(),
});

export const createReportsSchema = z.object({
  category: reportCategorySchema.optional(),
  title: z.string().min(1, "Report title cannot be empty."),
  description: z.string().min(1, "Report description cannot be empty."),
  attachments: z.array(z.uuid()).max(10).default([]),
  submittedBy: z.uuid(),
  status: z.enum(["Pending", "Assigned", "Resolved"]).default("Pending"),
});

export const editReportSchema = z
  .object({
    reportId: z.uuid(),
    updates: z.object({
      category: reportCategorySchema.optional(),
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      attachments: z.array(z.uuid()).max(10).optional(),
      status: z.enum(["Pending", "Assigned", "Resolved"]).optional(),
    }),
  })
  .refine(
    (data) => Object.values(data.updates).some((value) => value !== undefined),
    { message: "At least one field must be updated" },
  );

export const deleteReportSchema = z.object({
  reportId: z.uuid(),
  deletedBy: z.uuid(),
});

export type SendReportInput = z.infer<typeof getReportsSchema>;
export type AssignReport = z.infer<typeof assignReportSchema>;
export type CreateReport = z.infer<typeof createReportsSchema>;
export type EditReport = z.infer<typeof editReportSchema>;
export type DeleteReport = z.infer<typeof deleteReportSchema>;
