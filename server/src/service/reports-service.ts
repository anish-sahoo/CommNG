import type { ReportRepository } from "@/data/repository/reports-repo.js";
import type {
  AssignReport,
  CreateReport,
  EditReport,
} from "@/types/reports-types.js";

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
  async getReportsForUser(userId: string) {
    return await this.reportsRepo.getReportsForUser(userId);
  }

  /**
   * Get every report (admin only)
   */
  async getAllReports() {
    return await this.reportsRepo.getAllReports();
  }

  /**
   * Create a new report
   * @param input Report creation data
   * @returns Created report object
   */
  async createReport(input: CreateReport) {
    return await this.reportsRepo.createReport(input);
  }

  /**
   * Update an existing report
   * @param reportId Report ID
   * @param updates Update data
   * @returns Updated report object
   */
  async updateReport(reportId: string, updates: EditReport["updates"]) {
    return await this.reportsRepo.updateReport(reportId, updates);
  }

  /**
   * Delete a report
   * @param reportId Report ID
   * @param _deletedBy User ID (reserved for future audit trail)
   * @returns Deleted report object
   */
  async deleteReport(reportId: string, _deletedBy: string) {
    // Future: audit trail can use deletedBy
    return await this.reportsRepo.deleteReport(reportId);
  }

  /**
   * Assign a report to a user
   * @param input Assignment data
   * @returns Assignment object
   */
  async assignReport(input: AssignReport) {
    return await this.reportsRepo.assignReport(input);
  }
}
