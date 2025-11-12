import type { ReportRepository } from "../data/repository/reports-repo.js";

export class ReportService {
  private reportsRepo: ReportRepository;

  /**
   * @param reportsRepo (optional) a reportRepository instance
   */
  constructor(reportsRepo: ReportRepository) {
    this.reportsRepo = reportsRepo;
  }

  async getHelloWorld(name: string) {
    return await this.reportsRepo.getReportsForUser(name);
  }
}