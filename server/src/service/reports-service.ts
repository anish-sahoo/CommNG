import type { ReportRepository } from "../data/repository/reports-repo.js";
import type {
  AssignReport,
  CreateReport,
  EditReport,
} from "../types/reports-types.js";

/**
 * Service for managing reports (create, edit, delete, assign)
 */
export class ReportService {
  private reportsRepo: ReportRepository;

  constructor(reportsRepo: ReportRepository) {
    this.reportsRepo = reportsRepo;
  }

  /**
   * Get all reports for a user
   * @param userId User ID
   * @returns Array of reports
   */
  getReportsForUser(userId: string) {
    return this.reportsRepo.getReportsForUser(userId);
  }

  /**
   * Get every report (admin only)
   */
  getAllReports() {
    return this.reportsRepo.getAllReports();
  }

  /**
   * Create a new report
   * @param input Report creation data
   * @returns Created report object
   */
  createReport(input: CreateReport) {
    return this.reportsRepo.createReport(input);
  }

  /**
   * Update an existing report
   * @param reportId Report ID
   * @param updates Update data
   * @returns Updated report object
   */
  updateReport(reportId: string, updates: EditReport["updates"]) {
    return this.reportsRepo.updateReport(reportId, updates);
  }

  /**
   * Delete a report
   * @param reportId Report ID
   * @param _deletedBy User ID (reserved for future audit trail)
   * @returns Deleted report object
   */
  deleteReport(reportId: string, _deletedBy: string) {
    // Future: audit trail can use deletedBy
    return this.reportsRepo.deleteReport(reportId);
  }

  /**
   * Assign a report to a user
   * @param input Assignment data
   * @returns Assignment object
   */
  assignReport(input: AssignReport) {
    return this.reportsRepo.assignReport(input);
  }
}
