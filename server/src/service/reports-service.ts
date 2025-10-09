import { ReportRepository } from "../data/repository/reports-repo.js";
import { BadRequestError } from "../types/errors.js";

export class ReportService {
  private reportsRepo: ReportRepository;

  /**
   * @param reportsRepo (optional) a reportRepository instance
   */
  constructor(reportsRepo?: ReportRepository) {
    this.reportsRepo = reportsRepo ?? new ReportRepository();
  }

  async getHelloWorld(name: string) {
    if (name !== "anish") {
      throw new BadRequestError("wrong name provided :(");
    }

    const reports = await this.reportsRepo.getReportsForUser(name);

    return {
      id: name.length,
      content: `Here are the reports, ${name}`,
      reports: reports.map((report, i) => ({
        name: `Report ${i}`,
        data: report,
      })),
    };
  }
}
