import { isDatabaseConnected, connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { SourceModel } from '../models/Source.js';
import { FactCheckModel } from '../models/FactCheck.js';
import { AlertModel } from '../models/Alert.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { VerificationModel } from '../models/Verification.js';
import { hashPasswordSync } from '../utils/security.js';
import { env } from '../config/environment.js';

export const SEED_USERS = [
  {
    full_name: 'Dion Malik Deh',
    email: 'dion12@gmail.com',
    password_hash: hashPasswordSync('dion0244'),
    role: 'ADMIN',
    status: 'ACTIVE',
    organization: 'VerifAI GH Governance & Security',
    role_title: 'Chief Security Architect & Senior Fact-Checker',
    phone: '+233 24 400 0000',
    bio: 'Chief Security Architect and Administrator overseeing real-time verifications and provenance audits on VerifAI GH.',
  },
];

export const SEED_SOURCES = [
  {
    name: 'Ghana News Agency (GNA)',
    domain: 'gna.org.gh',
    status: 'VERIFIED',
    credibilityScore: 96,
    isVerified: true,
    isOfficial: true,
    category: 'Government & National Wire',
    country: 'Ghana',
    description: 'Official national wire service with strict verification protocols across 16 administrative regions.',
    previousMisinformationCount: 0,
    totalVerifications: 142,
  },
  {
    name: 'Daily Graphic Ghana',
    domain: 'graphic.com.gh',
    status: 'VERIFIED',
    credibilityScore: 92,
    isVerified: true,
    isOfficial: false,
    category: 'National Press & Media',
    country: 'Ghana',
    description: 'Flagship national daily broadsheet with established regional investigative correspondents.',
    previousMisinformationCount: 1,
    totalVerifications: 98,
  },
  {
    name: 'Citi Newsroom / Channel One TV',
    domain: 'citinewsroom.com',
    status: 'TRUSTED',
    credibilityScore: 89,
    isVerified: true,
    isOfficial: false,
    category: 'Broadcast & Digital Media',
    country: 'Ghana',
    description: 'Independent digital news portal and broadcast station specializing in data journalism.',
    previousMisinformationCount: 2,
    totalVerifications: 115,
  },
  {
    name: 'Ministry of Information Ghana',
    domain: 'moi.gov.gh',
    status: 'VERIFIED',
    credibilityScore: 98,
    isVerified: true,
    isOfficial: true,
    category: 'Government Portal',
    country: 'Ghana',
    description: 'Official communications vehicle of the Government of Ghana and statutory gazette releases.',
    previousMisinformationCount: 0,
    totalVerifications: 67,
  },
  {
    name: 'Viral WhatsApp Broadcasts',
    domain: 'whatsapp-forward.org',
    status: 'UNRELIABLE',
    credibilityScore: 18,
    isVerified: false,
    isOfficial: false,
    category: 'Social Channels',
    country: 'Global / Regional',
    description: 'Anonymous chain messages and uncorroborated multimedia forwards with high fabrication frequency.',
    previousMisinformationCount: 42,
    totalVerifications: 88,
  },
];

export const SEED_ALERTS = [
  {
    title: 'Phishing Campaign: Fraudulent Telco SIM Re-registration Prompts',
    severity: 'HIGH',
    type: 'PHISHING_ALERT',
    isActive: true,
    message: 'Circulating SMS and WhatsApp claims urging users to enter mobile money PINs on unofficial portals are confirmed phishing attacks.',
    affectedSectors: ['Telecommunications', 'Financial Services', 'Mobile Money'],
    recommendedAction: 'Advise citizens to ignore shortcodes not officially authorized by the National Communications Authority.',
    createdAt: new Date('2026-08-18T09:00:00Z'),
  },
  {
    title: 'Fabricated High School Placement Grant Circular',
    severity: 'MEDIUM',
    type: 'MISINFORMATION_ALERT',
    isActive: true,
    message: 'A forged letter with fake Ministry of Education letterhead claiming monetary grants for school placement has been debunked.',
    affectedSectors: ['Education', 'Public Administration'],
    recommendedAction: 'Refer to free SHS secretariat official portal for authentic admission directives.',
    createdAt: new Date('2026-08-19T14:30:00Z'),
  },
];

export async function runDatabaseSeed() {
  console.log('[Seed] Starting database seed routine...');

  // Enforce ADMIN_SETUP_KEY security validation (length >= 8 characters)
  if (!env.ADMIN_SETUP_KEY || env.ADMIN_SETUP_KEY.trim().length < 8) {
    console.error(
      '[Seed] Security Error: ADMIN_SETUP_KEY must be configured with a secret of at least 8 characters. Blocking admin seed execution.'
    );
    return;
  }

  const connected = await connectDatabase();

  if (!connected) {
    console.log('[Seed] Database not connected. Seed isolated to standalone utility.');
    return;
  }

  try {
    // 1. Seed Users
    console.log('[Seed] Seeding default admin and testing accounts...');
    for (const u of SEED_USERS) {
      await UserModel.findOneAndUpdate(
        { email: u.email },
        {
          name: u.full_name,
          email: u.email,
          password: u.password_hash,
          role: u.role,
          status: u.status,
          organization: u.organization,
          roleTitle: u.role_title,
          phone: u.phone,
          bio: u.bio,
        },
        { upsert: true, new: true }
      );
    }

    // 2. Seed Sources
    console.log('[Seed] Seeding verified news and government source registries...');
    for (const src of SEED_SOURCES) {
      await SourceModel.findOneAndUpdate(
        { domain: src.domain },
        src,
        { upsert: true, new: true }
      );
    }

    // 3. Seed Alerts
    console.log('[Seed] Seeding administrative warning alerts...');
    for (const alert of SEED_ALERTS) {
      await AlertModel.findOneAndUpdate(
        { title: alert.title },
        alert,
        { upsert: true, new: true }
      );
    }

    console.log('[Seed] Database seed completed successfully!');
  } catch (error) {
    console.error('[Seed] Database seed error:', error);
  } finally {
    await disconnectDatabase();
  }
}

// Auto-run if executed directly as a node script
if (process.argv[1]?.includes('seed.ts')) {
  runDatabaseSeed().then(() => process.exit(0));
}
