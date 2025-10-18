import { ReportRepository } from "../data/repository/reports-repo.js";

export class ReportService {
  private reportsRepo: ReportRepository;

  /**
   * @param reportsRepo (optional) a reportRepository instance
   */
  constructor(reportsRepo?: ReportRepository) {
    this.reportsRepo = reportsRepo ?? new ReportRepository();
  }

  async getHelloWorld(name: string) {
    return await this.reportsRepo.getReportsForUser(name);
  }
}
