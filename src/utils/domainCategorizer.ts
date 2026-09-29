import { ContentType } from '../types';

export type SourceFolderCategory =
  | 'GOVERNMENT'
  | 'NEWS'
  | 'SOCIAL_MEDIA'
  | 'ACADEMIC'
  | 'BLOGS_COMMUNITY'
  | 'DIRECT_CLAIMS';

export interface SourceFolderInfo {
  id: SourceFolderCategory;
  name: string;
  shortLabel: string;
  description: string;
  iconName: 'Building2' | 'Newspaper' | 'Share2' | 'GraduationCap' | 'PenTool' | 'MessageSquare';
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  pillBg: string;
  pillText: string;
  accentColor: string;
}

export const FOLDER_METADATA: Record<SourceFolderCategory, SourceFolderInfo> = {
  GOVERNMENT: {
    id: 'GOVERNMENT',
    name: 'Government Sources',
    shortLabel: 'Government',
    description: 'Official ministries, state agencies, public health institutes, and intergovernmental bodies.',
    iconName: 'Building2',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    pillBg: 'bg-emerald-100 text-emerald-900',
    pillText: 'text-emerald-800',
    accentColor: '#059669',
  },
  NEWS: {
    id: 'NEWS',
    name: 'News Articles',
    shortLabel: 'News & Press',
    description: 'Accredited journalism, investigative bureaus, broadcast networks, and digital newsrooms.',
    iconName: 'Newspaper',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    pillBg: 'bg-blue-100 text-blue-900',
    pillText: 'text-blue-800',
    accentColor: '#2563eb',
  },
  SOCIAL_MEDIA: {
    id: 'SOCIAL_MEDIA',
    name: 'Social Media',
    shortLabel: 'Social Feeds',
    description: 'Viral posts, public timelines, chat forwards, and video sharing platforms.',
    iconName: 'Share2',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    pillBg: 'bg-purple-100 text-purple-900',
    pillText: 'text-purple-800',
    accentColor: '#7c3aed',
  },
  ACADEMIC: {
    id: 'ACADEMIC',
    name: 'Academic & Research',
    shortLabel: 'Academic',
    description: 'Peer-reviewed journals, university repositories, and scientific pre-print archives.',
    iconName: 'GraduationCap',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    pillBg: 'bg-indigo-100 text-indigo-900',
    pillText: 'text-indigo-800',
    accentColor: '#4f46e5',
  },
  BLOGS_COMMUNITY: {
    id: 'BLOGS_COMMUNITY',
    name: 'Community & Blogs',
    shortLabel: 'Blogs & Forums',
    description: 'Self-published newsletters, opinion commentary, open forums, and independent blogs.',
    iconName: 'PenTool',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200',
    pillBg: 'bg-amber-100 text-amber-900',
    pillText: 'text-amber-900',
    accentColor: '#d97706',
  },
  DIRECT_CLAIMS: {
    id: 'DIRECT_CLAIMS',
    name: 'Direct Claims & Forwards',
    shortLabel: 'Direct Input',
    description: 'Direct text snippets, forwarded quotes, and image screenshots without canonical URLs.',
    iconName: 'MessageSquare',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    pillBg: 'bg-slate-200 text-slate-800',
    pillText: 'text-slate-700',
    accentColor: '#64748b',
  },
};

/**
 * Parses and extracts normalized hostname domain from URL or domain strings
 */
export function extractCleanDomain(rawUrlOrDomain?: string): string {
  if (!rawUrlOrDomain) return '';
  let str = rawUrlOrDomain.trim().toLowerCase();
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str);
      return url.hostname.replace(/^www\./, '');
    } catch {
      // fallback regex
      const match = str.match(/https?:\/\/(?:www\.)?([^\/\?#]+)/);
      if (match && match[1]) return match[1];
    }
  }
  return str.replace(/^www\./, '').split('/')[0].split('?')[0];
}

/**
 * Auto-tagging classifier engine:
 * Evaluates the analyzed URL or source domain against domain heuristics,
 * top-level domains (TLDs), and publisher patterns.
 */
export function categorizeSourceDomain(params: {
  url?: string;
  domain?: string;
  sourceName?: string;
  contentType?: ContentType | string;
  fullContent?: string;
}): SourceFolderInfo {
  const domain = extractCleanDomain(params.url || params.domain);
  const sourceName = (params.sourceName || '').toLowerCase();
  const contentType = params.contentType || '';
  const content = (params.fullContent || '').toLowerCase();

  // If no domain and is direct text/screenshot without external URL
  if (!domain && (contentType === 'TEXT' || contentType === 'SCREENSHOT')) {
    // Check if WhatsApp or forwarded text
    if (content.includes('whatsapp') || content.includes('forwarded as received') || content.includes('viral on')) {
      return FOLDER_METADATA.SOCIAL_MEDIA;
    }
    return FOLDER_METADATA.DIRECT_CLAIMS;
  }

  // 1. Government and Intergovernmental TLDs and known institutional domains
  if (
    domain.endsWith('.gov') ||
    domain.includes('.gov.') ||
    domain.endsWith('.mil') ||
    domain.includes('.mil.') ||
    domain.endsWith('.go.ug') ||
    domain.endsWith('.go.ke') ||
    domain.includes('who.int') ||
    domain.includes('un.org') ||
    domain.includes('unicef.org') ||
    domain.includes('worldbank.org') ||
    domain.includes('imf.org') ||
    domain.includes('europa.eu') ||
    domain.includes('ec.europa.eu') ||
    domain.includes('moh.gov.gh') ||
    domain.includes('cdc.gov') ||
    domain.includes('fda.gov') ||
    domain.includes('nih.gov') ||
    domain.includes('ghanahealthservice.org') ||
    domain.includes('police.gov.gh') ||
    domain.includes('ec.gov.gh') ||
    domain.includes('gra.gov.gh') ||
    sourceName.includes('ministry') ||
    sourceName.includes('government') ||
    sourceName.includes('health bureau') ||
    sourceName.includes('world health organization')
  ) {
    return FOLDER_METADATA.GOVERNMENT;
  }

  // 2. Social Media, Messaging, Video and Micro-blogging platforms
  if (
    domain.includes('twitter.com') ||
    domain.includes('x.com') ||
    domain.includes('facebook.com') ||
    domain.includes('fb.com') ||
    domain.includes('instagram.com') ||
    domain.includes('tiktok.com') ||
    domain.includes('t.me') ||
    domain.includes('telegram.org') ||
    domain.includes('telegram.me') ||
    domain.includes('whatsapp.com') ||
    domain.includes('wa.me') ||
    domain.includes('reddit.com') ||
    domain.includes('youtube.com') ||
    domain.includes('youtu.be') ||
    domain.includes('linkedin.com') ||
    domain.includes('threads.net') ||
    domain.includes('snapchat.com') ||
    domain.includes('pinterest.com') ||
    domain.includes('discord.com') ||
    domain.includes('quora.com') ||
    sourceName.includes('twitter') ||
    sourceName.includes('facebook') ||
    sourceName.includes('whatsapp') ||
    sourceName.includes('tiktok') ||
    sourceName.includes('telegram')
  ) {
    return FOLDER_METADATA.SOCIAL_MEDIA;
  }

  // 3. Academic, Scientific, University and Peer-Reviewed Journals
  if (
    domain.endsWith('.edu') ||
    domain.includes('.edu.') ||
    domain.endsWith('.ac.uk') ||
    domain.includes('.ac.') ||
    domain.includes('nature.com') ||
    domain.includes('sciencedirect.com') ||
    domain.includes('thelancet.com') ||
    domain.includes('nejm.org') ||
    domain.includes('bmj.com') ||
    domain.includes('pnas.org') ||
    domain.includes('springer.com') ||
    domain.includes('wiley.com') ||
    domain.includes('cell.com') ||
    domain.includes('arxiv.org') ||
    domain.includes('biorxiv.org') ||
    domain.includes('medrxiv.org') ||
    domain.includes('researchgate.net') ||
    domain.includes('pubmed.ncbi.nlm.nih.gov') ||
    domain.includes('scholar.google.com') ||
    domain.includes('jstor.org') ||
    domain.includes('frontiersin.org') ||
    sourceName.includes('university') ||
    sourceName.includes('academic') ||
    sourceName.includes('science monitor') ||
    sourceName.includes('journal')
  ) {
    return FOLDER_METADATA.ACADEMIC;
  }

  // 4. Accredited News, Press, Broadcast, and Media Houses
  if (
    domain.endsWith('.news') ||
    domain.endsWith('.press') ||
    domain.includes('reuters.com') ||
    domain.includes('apnews.com') ||
    domain.includes('bbc.com') ||
    domain.includes('bbc.co.uk') ||
    domain.includes('cnn.com') ||
    domain.includes('aljazeera.com') ||
    domain.includes('bloomberg.com') ||
    domain.includes('nytimes.com') ||
    domain.includes('washingtonpost.com') ||
    domain.includes('theguardian.com') ||
    domain.includes('ft.com') ||
    domain.includes('graphic.com.gh') ||
    domain.includes('myjoyonline.com') ||
    domain.includes('citinewsroom.com') ||
    domain.includes('ghanaweb.com') ||
    domain.includes('3news.com') ||
    domain.includes('peacefmonline.com') ||
    domain.includes('starrfm.com.gh') ||
    domain.includes('dailyguidenetwork.com') ||
    domain.includes('theafricareport.com') ||
    domain.includes('allafrica.com') ||
    domain.includes('afp.com') ||
    domain.includes('dw.com') ||
    domain.includes('france24.com') ||
    domain.includes('cnbc.com') ||
    domain.includes('forbes.com') ||
    domain.includes('time.com') ||
    domain.includes('politico.com') ||
    domain.includes('economist.com') ||
    sourceName.includes('chronicle') ||
    sourceName.includes('times') ||
    sourceName.includes('news') ||
    sourceName.includes('tribune') ||
    sourceName.includes('gazette') ||
    sourceName.includes('post') ||
    sourceName.includes('daily') ||
    sourceName.includes('reuters') ||
    sourceName.includes('herald')
  ) {
    return FOLDER_METADATA.NEWS;
  }

  // 5. Community Blogs, Newsletters, and Open Publishing
  if (
    domain.includes('medium.com') ||
    domain.includes('substack.com') ||
    domain.includes('wordpress.com') ||
    domain.includes('blogspot.com') ||
    domain.includes('tumblr.com') ||
    domain.includes('wixsite.com') ||
    domain.includes('ghost.io') ||
    domain.includes('patreon.com') ||
    domain.includes('weebly.com') ||
    domain.includes('buzzfeed.com') ||
    sourceName.includes('blog') ||
    sourceName.includes('feed') ||
    sourceName.includes('forum')
  ) {
    return FOLDER_METADATA.BLOGS_COMMUNITY;
  }

  // If a URL was provided but is generic or unregistered
  if (domain) {
    // Default news if resembles domain with standard web address
    return FOLDER_METADATA.NEWS;
  }

  return FOLDER_METADATA.DIRECT_CLAIMS;
}

export function getAllFolderList(): SourceFolderInfo[] {
  return [
    FOLDER_METADATA.GOVERNMENT,
    FOLDER_METADATA.NEWS,
    FOLDER_METADATA.SOCIAL_MEDIA,
    FOLDER_METADATA.ACADEMIC,
    FOLDER_METADATA.BLOGS_COMMUNITY,
    FOLDER_METADATA.DIRECT_CLAIMS,
  ];
}
