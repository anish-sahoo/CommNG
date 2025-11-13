import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportRepository } from "../src/data/repository/reports-repo.js";
import { ReportService } from "../src/service/reports-service.js";
import type {
  AssignReport,
  CreateReport,
  EditReport,
} from "../src/types/reports-types.js";

type ReportWithAttachments = Awaited<
  ReturnType<ReportRepository["getReportsForUser"]>
>[number];

function buildReport(
  overrides: Partial<ReportWithAttachments> = {},
): ReportWithAttachments {
  const base: ReportWithAttachments = {
    reportId: "report-123",
    category: "Communication",
    title: "Need more resources",
    description: "Details about the request",
    status: "Pending",
    submittedBy: "user-123",
    assignedTo: null,
    assignedBy: null,
    createdAt: new Date("2024-10-15T00:00:00.000Z"),
    updatedAt: new Date("2024-10-15T00:00:00.000Z"),
    resolvedAt: null,
    attachments: [],
  };
  return { ...base, ...overrides };
}

function createMockRepo() {
  return {
    getReportsForUser: vi.fn(),
    getReportById: vi.fn(),
    createReport: vi.fn(),
    updateReport: vi.fn(),
    deleteReport: vi.fn(),
    assignReport: vi.fn(),
  };
}

describe("ReportService", () => {
  let repoMocks: ReturnType<typeof createMockRepo>;
  let service: ReportService;

  beforeEach(() => {
    repoMocks = createMockRepo();
    service = new ReportService(repoMocks as unknown as ReportRepository);
  });

  it("returns reports for the requested user", async () => {
    const userId = "user-42";
    const reports = [
      buildReport({ reportId: "report-1", submittedBy: userId }),
    ];
    repoMocks.getReportsForUser.mockResolvedValue(reports);

    const result = await service.getReportsForUser(userId);

    expect(repoMocks.getReportsForUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual(reports);
  });

  it("creates a report through the repository", async () => {
    const payload: CreateReport = {
      category: "Mentorship",
      title: "Need a mentor",
      description: "Requesting mentorship support",
      attachments: [],
      submittedBy: "user-7",
      status: "Pending",
    };
    const created = buildReport({
      reportId: "report-new",
      category: payload.category,
      title: payload.title,
      description: payload.description,
      submittedBy: payload.submittedBy,
    });
    repoMocks.createReport.mockResolvedValue(created);

    const result = await service.createReport(payload);

    expect(repoMocks.createReport).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });

  it("updates a report with the provided patch payload", async () => {
    const reportId = "report-99";
    const updates: EditReport["updates"] = {
      title: "Updated title",
      description: "Updated description",
      status: "Assigned",
      attachments: ["file-1", "file-2"],
    };
    const updated = buildReport({
      reportId,
      title: updates.title ?? "",
      description: updates.description ?? "",
      status: updates.status ?? "Pending",
      attachments: [],
    });
    repoMocks.updateReport.mockResolvedValue(updated);

    const result = await service.updateReport(reportId, updates);

    expect(repoMocks.updateReport).toHaveBeenCalledWith(reportId, updates);
    expect(result).toEqual(updated);
  });

  it("deletes a report and ignores deletedBy in repository call", async () => {
    const reportId = "report-55";
    repoMocks.deleteReport.mockResolvedValue({ reportId });

    const result = await service.deleteReport(reportId, "admin-1");

    expect(repoMocks.deleteReport).toHaveBeenCalledWith(reportId);
    expect(result).toEqual({ reportId });
  });

  it("assigns a report to a target assignee", async () => {
    const payload: AssignReport = {
      reportId: "report-77",
      assigneeId: "manager-1",
      assignedBy: "admin-9",
    };
    const assigned = buildReport({
      reportId: payload.reportId,
      assignedTo: payload.assigneeId,
      assignedBy: payload.assignedBy,
      status: "Assigned",
    });
    repoMocks.assignReport.mockResolvedValue(assigned);

    const result = await service.assignReport(payload);

    expect(repoMocks.assignReport).toHaveBeenCalledWith(payload);
    expect(result).toEqual(assigned);
  });
});
