import { UserStatistics } from '../types/verification.types.js';
import { isDatabaseConnected } from '../config/database.js';
import { VerificationModel } from '../models/Verification.js';
import { verificationService } from './verification.service.js';
import { getVerificationStats, statsEventBus } from './verificationStats.service.js';

export class StatisticsService {
  async getUserStatistics(userId?: string, timeframe: string = '30d'): Promise<any> {
    return getVerificationStats({ userId, timeframe });
  }

  async seedSampleData(_userId: string = 'dev_user_seed'): Promise<{ count: number }> {
    // Disabled: only legitimate user verifications and live search results populate the system
    return { count: 0 };
  }
}

export const statisticsService = new StatisticsService();
