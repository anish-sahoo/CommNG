import type { ReportRepository } from "../data/repository/reports-repo.js";
import type {
  AssignReport,
  CreateReport,
  EditReport,
} from "../types/reports-types.js";

export class ReportService {
  private reportsRepo: ReportRepository;

  /**
   * @param reportsRepo (optional) a reportRepository instance
   */
  constructor(reportsRepo: ReportRepository) {
    this.reportsRepo = reportsRepo;
  }

  async getReportsForUser(userId: string) {
    return await this.reportsRepo.getReportsForUser(userId);
  }

  async createReport(input: CreateReport) {
    return await this.reportsRepo.createReport(input);
  }

  async updateReport(reportId: string, updates: EditReport["updates"]) {
    return await this.reportsRepo.updateReport(reportId, updates);
  }

  async deleteReport(reportId: string, _deletedBy: string) {
    // Future: audit trail can use deletedBy
    return await this.reportsRepo.deleteReport(reportId);
  }

  async assignReport(input: AssignReport) {
    return await this.reportsRepo.assignReport(input);
  }
}
