import { ReportRepository } from "../data/repository/reports-repo.js";
import { reportingRole } from "../data/roles.js";
import { PolicyEngine } from "../service/policy-engine.js";
import { ReportService } from "../service/reports-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { roleProcedure, router } from "../trpc/trpc.js";
import {
  assignReportSchema,
  createReportsSchema,
  deleteReportSchema,
  editReportSchema,
  getReportsSchema,
} from "../types/reports-types.js";

const reportService = new ReportService(new ReportRepository());
const ADMIN_REPORT_ROLES = [reportingRole("admin"), reportingRole("assign")];

const getReports = roleProcedure([reportingRole("read")])
  .input(getReportsSchema)
  .meta({ description: "Returns the list of reports" })
  .mutation(({ ctx, input }) =>
    withErrorHandling("getReports", () => {
      const roleSet = ctx.roles ?? new Set();
      const canViewAll = PolicyEngine.validateList(roleSet, ADMIN_REPORT_ROLES);

      if (canViewAll) {
        return reportService.getAllReports();
      }

      return reportService.getReportsForUser(input.name);
    }),
  );

const createReport = roleProcedure([reportingRole("create")])
  .input(createReportsSchema)
  .meta({ description: "Creates a new report" })
  .mutation(({ input }) =>
    withErrorHandling("createReport", () => reportService.createReport(input)),
  );

const updateReport = roleProcedure([reportingRole("update")])
  .input(editReportSchema)
  .meta({ description: "Updates an existing report" })
  .mutation(({ input }) =>
    withErrorHandling("updateReport", () =>
      reportService.updateReport(input.reportId, input.updates),
    ),
  );

const deleteReport = roleProcedure([reportingRole("delete")])
  .input(deleteReportSchema)
  .meta({ description: "Deletes a report" })
  .mutation(({ input }) =>
    withErrorHandling("deleteReport", () =>
      reportService.deleteReport(input.reportId, input.deletedBy),
    ),
  );

const assignReport = roleProcedure([reportingRole("assign")])
  .input(assignReportSchema)
  .meta({ description: "Assigns a report to a user" })
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
