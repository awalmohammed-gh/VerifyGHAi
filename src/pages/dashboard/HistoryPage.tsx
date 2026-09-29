import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  FileCheck,
  Calendar,
  Sparkles,
  Folder,
  FolderOpen,
  Building2,
  Newspaper,
  Share2,
  GraduationCap,
  PenTool,
  MessageSquare,
  Globe,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { verificationService } from '../../services/verificationService';
import { recentSearchesService, RecentSearchQuery } from '../../services/recentSearchesService';
import { Submission, Classification } from '../../types';
import { RecentVerificationTable } from '../../components/dashboard/RecentVerificationTable';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { HistoryPageSkeleton } from '../../components/common/Skeleton';
import { Pagination } from '../../components/common/Pagination';
import {
  SourceFolderCategory,
  FOLDER_METADATA,
  categorizeSourceDomain,
  getAllFolderList,
} from '../../utils/domainCategorizer';

export const HistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearchQuery[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        const data = await verificationService.getUserSubmissions(currentUser.id);
        setSubmissions(data);
        const searches = recentSearchesService.getRecentSearches(currentUser.id, 5);
        setRecentSearches(searches);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  // Compute folder metrics from submissions
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: submissions.length,
      GOVERNMENT: 0,
      NEWS: 0,
      SOCIAL_MEDIA: 0,
      ACADEMIC: 0,
      BLOGS_COMMUNITY: 0,
      DIRECT_CLAIMS: 0,
    };

    submissions.forEach((sub) => {
      const folder = categorizeSourceDomain({
        url: sub.url,
        domain: sub.result?.source.domain,
        sourceName: sub.result?.source.name,
        contentType: sub.contentType,
        fullContent: sub.fullContent,
      });
      if (counts[folder.id] !== undefined) {
        counts[folder.id] += 1;
      }
    });

    return counts;
  }, [submissions]);

  // Client filtering
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const folder = categorizeSourceDomain({
        url: sub.url,
        domain: sub.result?.source.domain,
        sourceName: sub.result?.source.name,
        contentType: sub.contentType,
        fullContent: sub.fullContent,
      });

      const matchesFolder = selectedFolder === 'ALL' || folder.id === selectedFolder;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        sub.fullContent.toLowerCase().includes(query) ||
        (sub.url && sub.url.toLowerCase().includes(query)) ||
        (sub.result?.source.name && sub.result.source.name.toLowerCase().includes(query)) ||
        (sub.result?.source.domain && sub.result.source.domain.toLowerCase().includes(query)) ||
        folder.name.toLowerCase().includes(query) ||
        folder.shortLabel.toLowerCase().includes(query);

      const matchesClass =
        selectedClassification === 'ALL' || sub.result?.classification === selectedClassification;

      const matchesType = selectedType === 'ALL' || sub.contentType === selectedType;

      return matchesFolder && matchesSearch && matchesClass && matchesType;
    });
  }, [submissions, searchQuery, selectedFolder, selectedClassification, selectedType]);

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getFolderIcon = (id: string, className = 'w-4 h-4') => {
    switch (id) {
      case 'GOVERNMENT':
        return <Building2 className={className} />;
      case 'NEWS':
        return <Newspaper className={className} />;
      case 'SOCIAL_MEDIA':
        return <Share2 className={className} />;
      case 'ACADEMIC':
        return <GraduationCap className={className} />;
      case 'BLOGS_COMMUNITY':
        return <PenTool className={className} />;
      case 'DIRECT_CLAIMS':
        return <MessageSquare className={className} />;
      default:
        return <Folder className={className} />;
    }
  };

  const folderTabs: Array<{ id: string; label: string; count: number }> = [
    { id: 'ALL', label: 'All Folders', count: folderCounts.ALL },
    { id: 'GOVERNMENT', label: 'Government Sources', count: folderCounts.GOVERNMENT },
    { id: 'NEWS', label: 'News Articles', count: folderCounts.NEWS },
    { id: 'SOCIAL_MEDIA', label: 'Social Media', count: folderCounts.SOCIAL_MEDIA },
    { id: 'ACADEMIC', label: 'Academic & Research', count: folderCounts.ACADEMIC },
    { id: 'BLOGS_COMMUNITY', label: 'Community & Blogs', count: folderCounts.BLOGS_COMMUNITY },
    { id: 'DIRECT_CLAIMS', label: 'Direct Claims', count: folderCounts.DIRECT_CLAIMS },
  ];

  if (isLoading) {
    return <HistoryPageSkeleton />;
  }

  const activeFolderMeta =
    selectedFolder !== 'ALL' ? FOLDER_METADATA[selectedFolder as SourceFolderCategory] : null;

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Verification History</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Auto-Tagging Enabled
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Access previous fact-check assessments automatically organized into smart category folders based on analyzed URL domains.
            </p>
          </div>

          <Link to="/verify">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Verify New Content
            </Button>
          </Link>
        </div>

        {/* Auto-Tagging Folder Selector Hub */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Category Folders</span>
            </div>
            <span className="text-[11px] text-slate-400">Categorized by analyzed URL domain</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
            {folderTabs.map((folder) => {
              const isSelected = selectedFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {getFolderIcon(folder.id, isSelected ? 'w-3.5 h-3.5 text-blue-300' : 'w-3.5 h-3.5 text-slate-500')}
                  <span>{folder.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-slate-800 text-blue-200' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {folder.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Folder Context Banner */}
        {activeFolderMeta && (
          <div className={`p-4 rounded-2xl border ${activeFolderMeta.badgeBg} ${activeFolderMeta.badgeBorder} flex items-start gap-3 text-xs`}>
            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center flex-shrink-0">
              {getFolderIcon(activeFolderMeta.id, 'w-4 h-4 text-slate-800')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-bold ${activeFolderMeta.badgeText}`}>{activeFolderMeta.name}</h4>
                <span className="text-[10px] font-mono uppercase bg-white/80 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200">
                  Folder Filter Active
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-0.5">{activeFolderMeta.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFolder('ALL')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
            >
              Reset to All Folders
            </button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <Input
                placeholder="Search by keywords, source, domain, or auto-tag..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                  if (e.target.value.trim().length > 3) {
                    recentSearchesService.addSearchQuery(e.target.value.trim(), {
                      userId: currentUser?.id,
                      type: 'search',
                    });
                  }
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedClassification}
                onChange={(e) => {
                  setSelectedClassification(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Classifications' },
                  { value: 'VERIFIED', label: 'VERIFIED' },
                  { value: 'TRUSTED', label: 'TRUSTED' },
                  { value: 'SUSPICIOUS', label: 'SUSPICIOUS' },
                  { value: 'FAKE', label: 'FAKE' },
                ]}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Formats' },
                  { value: 'TEXT', label: 'Text Snippets' },
                  { value: 'ARTICLE_URL', label: 'Article URLs' },
                  { value: 'SCREENSHOT', label: 'Screenshots' },
                ]}
              />
            </div>
          </div>

          {/* Quick Recent Search Tags */}
          {recentSearches.length > 0 && !searchQuery && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Recent Queries:
              </span>
              {recentSearches.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item.query);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100/90 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/60 hover:border-blue-200 transition-colors cursor-pointer max-w-[200px] truncate"
                >
                  {item.query}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-slate-700">
            Showing {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'Report' : 'Reports'}
            {selectedFolder !== 'ALL' && ` in ${activeFolderMeta?.name}`}
          </span>
          {(searchQuery || selectedFolder !== 'ALL' || selectedClassification !== 'ALL' || selectedType !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedFolder('ALL');
                setSelectedClassification('ALL');
                setSelectedType('ALL');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <RecentVerificationTable
          submissions={paginatedSubmissions}
          emptyMessage={
            searchQuery || selectedFolder !== 'ALL' || selectedClassification !== 'ALL' || selectedType !== 'ALL'
              ? 'No verifications match your active search and category folder filters.'
              : 'You have no verification history yet.'
          }
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSubmissions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};
