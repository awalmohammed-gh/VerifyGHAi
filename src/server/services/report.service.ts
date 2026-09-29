import { IReport, IVerification } from '../types/verification.types.js';
import { isDatabaseConnected } from '../config/database.js';
import { ReportModel } from '../models/Report.js';
import { VerificationModel } from '../models/Verification.js';
import { ApiError } from '../utils/apiError.js';

export class ReportService {
  private inMemoryReports: IReport[] = [];

  async createReport(
    userId: string,
    verificationId: string,
    title?: string
  ): Promise<{ report: IReport; verification: IVerification }> {
    let verification: any = null;

    if (isDatabaseConnected()) {
      try {
        verification = await VerificationModel.findOne({
          _id: verificationId,
          $or: [{ userId }, { userId: userId.toString() }],
        });
      } catch (err) {
        console.warn('[ReportService] Verification lookup error:', err);
      }
    }

    if (!verification) {
      // Fallback check
      throw ApiError.notFound('Verification record not found or does not belong to you.');
    }

    const reportTitle =
      title?.trim() ||
      `Verification Dossier: ${
        verification.automatedResult?.classification || 'Analysis'
      } - ${new Date().toLocaleDateString()}`;

    const keyFindings: string[] = [];
    if (verification.automatedResult?.explanation) {
      keyFindings.push(verification.automatedResult.explanation);
    }
    if (verification.automatedResult?.recommendation) {
      keyFindings.push(verification.automatedResult.recommendation);
    }
    if (verification.automatedResult?.warning) {
      keyFindings.push(`Warning: ${verification.automatedResult.warning}`);
    }

    const reportData: IReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      verificationId,
      title: reportTitle,
      summary: verification.automatedResult?.explanation || 'Comprehensive verification intelligence summary.',
      keyFindings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await ReportModel.create({
          userId,
          verificationId,
          title: reportTitle,
          summary: reportData.summary,
          keyFindings,
        });
        reportData.id = doc._id.toString();
      } catch (err) {
        console.warn('[ReportService] DB report create failed, stored in memory:', err);
      }
    }

    this.inMemoryReports.unshift(reportData);

    return {
      report: reportData,
      verification: verification.toJSON ? verification.toJSON() : verification,
    };
  }

  async getUserReports(userId: string): Promise<IReport[]> {
    if (isDatabaseConnected()) {
      try {
        const docs = await ReportModel.find({
          $or: [{ userId }, { userId: userId.toString() }],
        }).sort({ createdAt: -1 });

        return docs.map((d) => ({
          id: d._id.toString(),
          userId: d.userId.toString(),
          verificationId: d.verificationId.toString(),
          title: d.title,
          summary: d.summary,
          keyFindings: d.keyFindings,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }));
      } catch (err) {
        console.warn('[ReportService] DB find error:', err);
      }
    }

    return this.inMemoryReports.filter(
      (r) => r.userId === userId || r.userId === userId.toString()
    );
  }

  async getReportById(
    id: string,
    userId: string
  ): Promise<{ report: IReport; verification?: IVerification }> {
    let report: IReport | null = null;

    if (isDatabaseConnected()) {
      try {
        const doc = await ReportModel.findOne({
          _id: id,
          $or: [{ userId }, { userId: userId.toString() }],
        });
        if (doc) {
          report = {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            verificationId: doc.verificationId.toString(),
            title: doc.title,
            summary: doc.summary,
            keyFindings: doc.keyFindings,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
        }
      } catch (err) {
        console.warn('[ReportService] DB lookup error:', err);
      }
    }

    if (!report) {
      report =
        this.inMemoryReports.find(
          (r) => r.id === id && (r.userId === userId || r.userId === userId.toString())
        ) || null;
    }

    if (!report) {
      throw ApiError.notFound('Report record not found or access denied.');
    }

    // Attach referenced verification if exists
    let verification: any = null;
    if (isDatabaseConnected()) {
      try {
        const vDoc = await VerificationModel.findById(report.verificationId);
        if (vDoc) {
          verification = vDoc.toJSON ? vDoc.toJSON() : vDoc;
        }
      } catch {}
    }

    return { report, verification };
  }

  async deleteReport(id: string, userId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const doc = await ReportModel.findOneAndDelete({
          _id: id,
          $or: [{ userId }, { userId: userId.toString() }],
        });
        if (doc) return true;
      } catch (err) {
        console.warn('[ReportService] Delete error:', err);
      }
    }

    const idx = this.inMemoryReports.findIndex(
      (r) => r.id === id && (r.userId === userId || r.userId === userId.toString())
    );
    if (idx !== -1) {
      this.inMemoryReports.splice(idx, 1);
      return true;
    }

    throw ApiError.notFound('Report not found or permission denied.');
  }
}

export const reportService = new ReportService();
