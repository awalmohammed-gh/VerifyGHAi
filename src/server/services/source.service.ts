import { ISource, SourceStatus } from '../types/source.types.js';
import { isDatabaseConnected } from '../config/database.js';
import { SourceModel } from '../models/Source.js';

// Pre-seeded verified source repository (Ghanaian & International news, health, government, fact-checkers)
const INITIAL_SOURCES: ISource[] = [
  {
    name: 'Ghana Fact Checking Hub (GhanaFact)',
    domain: 'ghanafact.com',
    description: 'Certified IFCN signatory news verification organization in Ghana.',
    credibilityScore: 94,
    status: 'VERIFIED',
    verificationStatus: 'IFCN_SIGNATORY_CERTIFIED',
  },
  {
    name: 'Dubawa Ghana',
    domain: 'dubawa.org',
    description: 'Independent fact-checking and verification platform across West Africa.',
    credibilityScore: 92,
    status: 'VERIFIED',
    verificationStatus: 'IFCN_SIGNATORY_CERTIFIED',
  },
  {
    name: 'Ghana Health Service (GHS)',
    domain: 'ghs.gov.gh',
    description: 'Official statutory agency responsible for public healthcare delivery and disease alerts in Ghana.',
    credibilityScore: 98,
    status: 'VERIFIED',
    verificationStatus: 'OFFICIAL_GOVERNMENT_ORGAN',
  },
  {
    name: 'Ministry of Information Ghana',
    domain: 'moi.gov.gh',
    description: 'Official government spokesperson and public communication department.',
    credibilityScore: 95,
    status: 'VERIFIED',
    verificationStatus: 'OFFICIAL_GOVERNMENT_ORGAN',
  },
  {
    name: 'Bank of Ghana (BoG)',
    domain: 'bog.gov.gh',
    description: 'Central bank regulator of financial sector, monetary notices, and currency advisories.',
    credibilityScore: 99,
    status: 'VERIFIED',
    verificationStatus: 'OFFICIAL_GOVERNMENT_ORGAN',
  },
  {
    name: 'Ghana News Agency (GNA)',
    domain: 'gna.org.gh',
    description: 'National state-backed news agency established for verified national reporting.',
    credibilityScore: 88,
    status: 'TRUSTED',
    verificationStatus: 'PUBLIC_NEWS_AUTHORITY',
  },
  {
    name: 'Graphic Online',
    domain: 'graphic.com.gh',
    description: 'Mainstream national daily newspaper and accredited journalism portal.',
    credibilityScore: 84,
    status: 'TRUSTED',
    verificationStatus: 'ACCREDITED_NEWS_MEDIA',
  },
  {
    name: 'Citi Newsroom',
    domain: 'citinewsroom.com',
    description: 'Accredited commercial broadcast journalism and investigative reporting newsroom in Accra.',
    credibilityScore: 83,
    status: 'TRUSTED',
    verificationStatus: 'ACCREDITED_NEWS_MEDIA',
  },
  {
    name: 'Joy Online (Multimedia Group)',
    domain: 'myjoyonline.com',
    description: 'Established Ghanaian broadcast journalism network and news portal.',
    credibilityScore: 82,
    status: 'TRUSTED',
    verificationStatus: 'ACCREDITED_NEWS_MEDIA',
  },
  {
    name: 'BBC News Africa',
    domain: 'bbc.com',
    description: 'International public broadcaster with regional fact-checking desk.',
    credibilityScore: 90,
    status: 'VERIFIED',
    verificationStatus: 'GLOBAL_NEWS_AUTHORITY',
  },
  {
    name: 'Reuters Fact Check',
    domain: 'reuters.com',
    description: 'International news and independent verification bureau.',
    credibilityScore: 95,
    status: 'VERIFIED',
    verificationStatus: 'GLOBAL_NEWS_AUTHORITY',
  },
  {
    name: 'Viral WhatsApp Forward Network',
    domain: 'whatsapp.com',
    description: 'Unverified peer-to-peer forwarded messaging origin with no editorial oversight.',
    credibilityScore: 18,
    status: 'UNRELIABLE',
    verificationStatus: 'UNVERIFIED_SOCIAL_NETWORK',
  },
  {
    name: 'TikTok Viral Video Aggregator',
    domain: 'tiktok.com',
    description: 'Short-form social media platform prone to uncontextualized audio manipulation.',
    credibilityScore: 22,
    status: 'SUSPICIOUS',
    verificationStatus: 'UNMODERATED_SOCIAL_NETWORK',
  },
];

export class SourceService {
  private localSources: Map<string, ISource> = new Map();

  constructor() {
    for (const src of INITIAL_SOURCES) {
      this.localSources.set(src.domain.toLowerCase(), src);
    }
  }

  extractDomain(urlOrDomain: string): string {
    if (!urlOrDomain) return '';
    try {
      let cleaned = urlOrDomain.trim().toLowerCase();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = `https://${cleaned}`;
      }
      const parsed = new URL(cleaned);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return urlOrDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    }
  }

  async getSourceByDomain(domainOrUrl: string): Promise<ISource> {
    const domain = this.extractDomain(domainOrUrl);

    if (isDatabaseConnected()) {
      try {
        const doc = await SourceModel.findOne({ domain });
        if (doc) {
          return {
            id: doc._id.toString(),
            name: doc.name,
            domain: doc.domain,
            description: doc.description,
            credibilityScore: doc.credibilityScore,
            status: doc.status as SourceStatus,
            verificationStatus: doc.verificationStatus,
            lastUpdated: doc.lastUpdated,
          };
        }
      } catch (err) {
        console.warn('[SourceService] DB lookup error:', err);
      }
    }

    if (this.localSources.has(domain)) {
      return { ...this.localSources.get(domain)! };
    }

    // Default unknown source evaluation
    const isGov = domain.endsWith('.gov.gh') || domain.endsWith('.gov') || domain.endsWith('.edu.gh');
    const isMajorSocial = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 't.me'].includes(domain);

    const defaultSource: ISource = {
      name: domain,
      domain,
      description: isGov ? 'Official Institutional Domain' : isMajorSocial ? 'Public Social Network' : 'Web Domain Source',
      credibilityScore: isGov ? 90 : isMajorSocial ? 35 : 50,
      status: isGov ? 'VERIFIED' : isMajorSocial ? 'SUSPICIOUS' : 'UNKNOWN',
      verificationStatus: isGov ? 'GOVERNMENT_TLD' : 'COMMUNITY_TRACKED',
      lastUpdated: new Date(),
    };

    return defaultSource;
  }

  async getSourceCredibility(domainOrUrl: string): Promise<number> {
    const source = await this.getSourceByDomain(domainOrUrl);
    return source.credibilityScore;
  }

  async saveSource(source: Partial<ISource> & { domain: string; name: string }): Promise<ISource> {
    const domain = this.extractDomain(source.domain);
    const credibilityScore = source.credibilityScore ?? 50;
    const status = source.status ?? (credibilityScore >= 80 ? 'TRUSTED' : credibilityScore >= 50 ? 'UNKNOWN' : 'SUSPICIOUS');

    const sourceData: ISource = {
      name: source.name,
      domain,
      description: source.description || '',
      credibilityScore,
      status,
      verificationStatus: source.verificationStatus || 'MANUALLY_RECORDED',
      lastUpdated: new Date(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await SourceModel.findOneAndUpdate(
          { domain },
          { $set: sourceData },
          { upsert: true, new: true }
        );
        return {
          id: doc._id.toString(),
          name: doc.name,
          domain: doc.domain,
          description: doc.description,
          credibilityScore: doc.credibilityScore,
          status: doc.status as SourceStatus,
          verificationStatus: doc.verificationStatus,
          lastUpdated: doc.lastUpdated,
        };
      } catch (err) {
        console.warn('[SourceService] Save source DB error:', err);
      }
    }

    this.localSources.set(domain, sourceData);
    return sourceData;
  }

  async getSourcesForVerification(domainsOrUrls: string[]): Promise<ISource[]> {
    const uniqueDomains = Array.from(new Set(domainsOrUrls.map((d) => this.extractDomain(d)).filter(Boolean)));
    const results: ISource[] = [];
    for (const d of uniqueDomains) {
      results.push(await this.getSourceByDomain(d));
    }
    return results;
  }
}

export const sourceService = new SourceService();
