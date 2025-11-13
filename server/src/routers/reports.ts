import { ReportRepository } from "../data/repository/reports-repo.js";
import { ReportService } from "../service/reports-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, router } from "../trpc/trpc.js";
import {
  assignReportSchema,
  createReportsSchema,
  deleteReportSchema,
  editReportSchema,
  getReportsSchema,
} from "../types/reports-types.js";
import { requirePermission } from "../utils/access_control.js";

const reportService = new ReportService(new ReportRepository());

const getReports = procedure
  .input(getReportsSchema)
  .use(requirePermission("reports:read"))
  .meta({ requiresAuth: true, description: "Returns the list of reports" })
  .mutation(({ input }) =>
    withErrorHandling("getReports", () =>
      reportService.getReportsForUser(input.name),
    ),
  );

const createReport = procedure
  .input(createReportsSchema)
  .use(requirePermission("reports:create"))
  .meta({ requiresAuth: true, description: "Creates a new report" })
  .mutation(({ input }) =>
    withErrorHandling("createReport", () => reportService.createReport(input)),
  );

const updateReport = procedure
  .input(editReportSchema)
  .use(requirePermission("reports:update"))
  .meta({ requiresAuth: true, description: "Updates an existing report" })
  .mutation(({ input }) =>
    withErrorHandling("updateReport", () =>
      reportService.updateReport(input.reportId, input.updates),
    ),
  );

const deleteReport = procedure
  .input(deleteReportSchema)
  .use(requirePermission("reports:delete"))
  .meta({ requiresAuth: true, description: "Deletes a report" })
  .mutation(({ input }) =>
    withErrorHandling("deleteReport", () =>
      reportService.deleteReport(input.reportId, input.deletedBy),
    ),
  );

const assignReport = procedure
  .input(assignReportSchema)
  .use(requirePermission("reports:assign"))
  .meta({ requiresAuth: true, description: "Assigns a report to a user" })
  .mutation(({ input }) =>
    withErrorHandling("assignReport", () => reportService.assignReport(input)),
  );

export const reportsRouter = router({
  getReports,
  createReport,
  updateReport,
  deleteReport,
  assignReport,
});
