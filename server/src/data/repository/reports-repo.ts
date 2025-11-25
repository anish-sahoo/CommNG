import { desc, eq, inArray } from "drizzle-orm";
import {
  files,
  type NewReport,
  reportAttachments,
  reports,
} from "../../data/db/schema.js";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  AssignReport,
  CreateReport,
  EditReport,
} from "../../types/reports-types.js";
import { db } from "../db/sql.js";

type Transaction = Parameters<typeof db.transaction>[0] extends (
  arg: infer T,
) => unknown
  ? T
  : never;

type Executor = Transaction | typeof db;

export type ReportAttachmentRecord = {
  fileId: string;
  fileName: string;
};

const BASE_REPORT_FIELDS = {
  reportId: reports.reportId,
  category: reports.category,
  title: reports.title,
  description: reports.description,
  status: reports.status,
  submittedBy: reports.submittedBy,
  assignedTo: reports.assignedTo,
  assignedBy: reports.assignedBy,
  createdAt: reports.createdAt,
  updatedAt: reports.updatedAt,
  resolvedAt: reports.resolvedAt,
};

/**
 * Repository to handle database queries/communication related to reports.
 */
export class ReportRepository {
  /**
   * Returns the reports created by a specific user.
   * @param userId User ID
   * @returns Array of report objects with attachments
   */
  async getReportsForUser(userId: string) {
    const result = await db
      .select(BASE_REPORT_FIELDS)
      .from(reports)
      .where(eq(reports.submittedBy, userId))
      .orderBy(desc(reports.createdAt));

    const attachmentMap = await this.getAttachmentsForReports(
      db,
      result.map((row) => row.reportId),
    );

    return result.map((row) => ({
      ...row,
      attachments: attachmentMap.get(row.reportId) ?? [],
    }));
  }

  /**
   * Returns every report regardless of submitter.
   */
  async getAllReports() {
    const result = await db
      .select(BASE_REPORT_FIELDS)
      .from(reports)
      .orderBy(desc(reports.createdAt));

    const attachmentMap = await this.getAttachmentsForReports(
      db,
      result.map((row) => row.reportId),
    );

    return result.map((row) => ({
      ...row,
      attachments: attachmentMap.get(row.reportId) ?? [],
    }));
  }

  /**
   * Fetch a single report by its ID.
   * @param reportId Report ID
   * @returns Report object with attachments
   * @throws NotFoundError if not found
   */
  async getReportById(reportId: string) {
    const [report] = await db
      .select(BASE_REPORT_FIELDS)
      .from(reports)
      .where(eq(reports.reportId, reportId))
      .limit(1);

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    const attachmentMap = await this.getAttachmentsForReports(db, [reportId]);

    return {
      ...report,
      attachments: attachmentMap.get(reportId) ?? [],
    };
  }

  /**
   * Create a new report.
   * @param input CreateReport input object
   * @returns Created report object with attachments
   * @throws ConflictError if creation fails
   */
  async createReport(input: CreateReport) {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(reports)
        .values({
          category: input.category ?? null,
          title: input.title,
          description: input.description,
          status: input.status,
          submittedBy: input.submittedBy,
        })
        .returning(BASE_REPORT_FIELDS);

      if (!created) {
        throw new ConflictError("Unable to create report");
      }

      await this.replaceAttachments(tx, created.reportId, input.attachments);

      const attachmentMap = await this.getAttachmentsForReports(tx, [
        created.reportId,
      ]);

      return {
        ...created,
        attachments: attachmentMap.get(created.reportId) ?? [],
      };
    });
  }

  /**
   * Update an existing report.
   * @param reportId Report ID
   * @param updates EditReport updates object
   * @returns Updated report object with attachments
   * @throws NotFoundError if not found
   * @throws ConflictError if update fails
   */
  async updateReport(reportId: string, updates: EditReport["updates"]) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ reportId: reports.reportId, status: reports.status })
        .from(reports)
        .where(eq(reports.reportId, reportId))
        .limit(1);

      if (!existing) {
        throw new NotFoundError("Report not found");
      }

      const updatePayload: Partial<NewReport> = {
        updatedAt: new Date(),
      };

      if (updates.category !== undefined) {
        updatePayload.category = updates.category;
      }
      if (updates.title !== undefined) {
        updatePayload.title = updates.title;
      }
      if (updates.description !== undefined) {
        updatePayload.description = updates.description;
      }
      if (updates.status !== undefined) {
        updatePayload.status = updates.status;
        updatePayload.resolvedAt =
          updates.status === "Resolved" ? new Date() : null;
      }

      if (Object.keys(updatePayload).length > 0) {
        await tx
          .update(reports)
          .set(updatePayload)
          .where(eq(reports.reportId, reportId));
      }

      if (updates.attachments !== undefined) {
        await this.replaceAttachments(tx, reportId, updates.attachments);
      }

      const [updated] = await tx
        .select(BASE_REPORT_FIELDS)
        .from(reports)
        .where(eq(reports.reportId, reportId))
        .limit(1);

      if (!updated) {
        throw new ConflictError("Unable to fetch updated report");
      }

      const attachmentMap = await this.getAttachmentsForReports(tx, [reportId]);

      return {
        ...updated,
        attachments: attachmentMap.get(reportId) ?? [],
      };
    });
  }

  /**
   * Delete a report permanently.
   * @param reportId Report ID
   * @returns Deleted report ID object
   * @throws NotFoundError if not found
   */
  async deleteReport(reportId: string) {
    const deleted = await db
      .delete(reports)
      .where(eq(reports.reportId, reportId))
      .returning({ reportId: reports.reportId });

    if (deleted.length === 0) {
      throw new NotFoundError("Report not found");
    }

    return deleted[0];
  }

  /**
   * Assign a report to another user and update the status.
   */
  /**
   * Assign a report to another user and update the status.
   * @param reportId Report ID
   * @param assigneeId Assignee user ID
   * @param assignedBy User ID who assigned
   * @returns Updated report object with attachments
   * @throws NotFoundError if not found
   */
  async assignReport({ reportId, assigneeId, assignedBy }: AssignReport) {
    const [updated] = await db
      .update(reports)
      .set({
        assignedTo: assigneeId,
        assignedBy,
        status: "Assigned",
        updatedAt: new Date(),
      })
      .where(eq(reports.reportId, reportId))
      .returning(BASE_REPORT_FIELDS);

    if (!updated) {
      throw new NotFoundError("Report not found");
    }

    const attachmentMap = await this.getAttachmentsForReports(db, [reportId]);

    return {
      ...updated,
      attachments: attachmentMap.get(reportId) ?? [],
    };
  }

  private async getAttachmentsForReports(
    executor: Executor,
    reportIds: string[],
  ) {
    const map = new Map<string, ReportAttachmentRecord[]>();

    if (reportIds.length === 0) {
      return map;
    }

    const rows = await executor
      .select({
        reportId: reportAttachments.reportId,
        fileId: reportAttachments.fileId,
        fileName: files.fileName,
      })
      .from(reportAttachments)
      .innerJoin(files, eq(reportAttachments.fileId, files.fileId))
      .where(inArray(reportAttachments.reportId, reportIds));

    for (const row of rows) {
      const existing = map.get(row.reportId) ?? [];
      existing.push({
        fileId: row.fileId,
        fileName: row.fileName,
      });
      map.set(row.reportId, existing);
    }

    for (const id of reportIds) {
      if (!map.has(id)) {
        map.set(id, []);
      }
    }

    return map;
  }

  private async replaceAttachments(
    executor: Executor,
    reportId: string,
    attachmentIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(attachmentIds))
      .filter(Boolean)
      .slice(0, 10);

    await executor
      .delete(reportAttachments)
      .where(eq(reportAttachments.reportId, reportId));

    if (uniqueIds.length === 0) {
      return;
    }

    await executor.insert(reportAttachments).values(
      uniqueIds.map((fileId) => ({
        reportId,
        fileId,
      })),
    );
  }
}
