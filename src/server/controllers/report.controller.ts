import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/response.js';

export class ReportController {
  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const verificationId = req.params.verificationId;
      const { title } = req.body || {};

      const result = await reportService.createReport(userId, verificationId, title);
      return ApiResponse.created(res, 'Report created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getUserReports(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const reports = await reportService.getUserReports(userId);
      return ApiResponse.success(res, 'User reports retrieved successfully', { reports });
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const reportId = req.params.id;
      const result = await reportService.getReportById(reportId, userId);
      return ApiResponse.success(res, 'Report dossier retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const reportId = req.params.id;
      await reportService.deleteReport(reportId, userId);
      return ApiResponse.success(res, 'Report successfully deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
