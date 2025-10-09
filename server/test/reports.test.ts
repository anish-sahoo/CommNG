import { describe, expect, it, vi } from "vitest";
import { ReportService } from "../src/service/reports-service.js";
import { BadRequestError } from "../src/types/errors.js";

describe("ReportService", () => {
  it("getHelloWorld returns formatted reports for valid user", async () => {
    const mockReports = [{ foo: 1 }, { bar: 2 }];
    const repoClassMock = {
      getReportsForUser: vi.fn().mockResolvedValue(mockReports),
    };

    const service = new ReportService(repoClassMock);
    const result = await service.getHelloWorld("anish");

    expect(repoClassMock.getReportsForUser).toHaveBeenCalledWith("anish");
    expect(result).toEqual({
      id: 5,
      content: "Here are the reports, anish",
      reports: [
        { name: "Report 0", data: { foo: 1 } },
        { name: "Report 1", data: { bar: 2 } },
      ],
    });
  });

  it("getHelloWorld throws BadRequestError for invalid user", async () => {
    const service = new ReportService();
    await expect(service.getHelloWorld("bob")).rejects.toThrow(BadRequestError);
    await expect(service.getHelloWorld("bob")).rejects.toThrow(
      "wrong name provided :(",
    );
  });
});
