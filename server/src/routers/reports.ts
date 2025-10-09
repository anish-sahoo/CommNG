import { ReportService } from "../service/reports-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, router } from "../trpc/trpc.js";
import { getReportsSchema } from "../types/reports-types.js";

const reportService = new ReportService();

const getReports = procedure
  .input(getReportsSchema)
  .meta({ requiresAuth: true, description: "Returns the list of reports" })
  .mutation(({ input }) =>
    withErrorHandling("getReports", () =>
      reportService.getHelloWorld(input.name),
    ),
  );

export const reportsRouter = router({
  getReports,
});
