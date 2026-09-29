import { UserRecord, UserRole } from '../types/index.js';
import { hashPasswordSync } from '../utils/security.js';

// Initial user store with static Administrator Dion Malik Deh
const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr_admin_dion_001',
    email: 'dion12@gmail.com',
    password_hash: hashPasswordSync('dion0244'),
    full_name: 'Dion Malik Deh',
    role: 'ADMIN',
    status: 'ACTIVE',
    organization: 'VerifAI GH Governance & Security',
    role_title: 'Chief Security Architect & Senior Fact-Checker',
    phone: '+233 24 400 0000',
    bio: 'Chief Security Architect and Administrator overseeing real-time verifications and provenance audits on VerifAI GH.',
    refresh_tokens: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

class UserStore {
  private users: Map<string, UserRecord> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    for (const user of INITIAL_USERS) {
      this.users.set(user.id, { ...user, refresh_tokens: [...user.refresh_tokens] });
    }
  }

  public async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public async create(data: {
    email: string;
    password_hash: string;
    full_name: string;
    role?: UserRole;
    status?: 'ACTIVE' | 'SUSPENDED';
    organization?: string;
    role_title?: string;
    phone?: string;
    bio?: string;
  }): Promise<UserRecord> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id,
      email: data.email.trim().toLowerCase(),
      password_hash: data.password_hash,
      full_name: data.full_name.trim(),
      role: data.role || 'USER', // Defaults new signups strictly to 'USER' role
      status: data.status || 'ACTIVE',
      organization: data.organization?.trim() || undefined,
      role_title: data.role_title?.trim() || 'Community Fact-Checker',
      phone: data.phone?.trim() || undefined,
      bio: data.bio?.trim() || undefined,
      refresh_tokens: [],
      created_at: now,
      updated_at: now,
    };

    this.users.set(id, newUser);
    return { ...newUser };
  }

  public async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const existing = this.users.get(id);
    if (!existing) return null;

    const updated: UserRecord = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      email: updates.email ? updates.email.trim().toLowerCase() : existing.email,
      updated_at: new Date().toISOString(),
    };

    this.users.set(id, updated);
    return { ...updated };
  }

  public async addRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    // Keep max 5 active refresh tokens per user for multi-device login
    const tokens = [token, ...user.refresh_tokens].slice(0, 5);
    user.refresh_tokens = tokens;
    user.updated_at = new Date().toISOString();
    return true;
  }

  public async removeRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.refresh_tokens = user.refresh_tokens.filter((t) => t !== token);
    return true;
  }

  public async clearAllRefreshTokens(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.refresh_tokens = [];
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  public async getAll(): Promise<UserRecord[]> {
    return Array.from(this.users.values()).map((u) => ({ ...u }));
  }
}

export const userStore = new UserStore();
