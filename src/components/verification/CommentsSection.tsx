import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  CornerDownRight,
  Link2,
  ExternalLink,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Clock,
  Sparkles,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VerificationComment, CommentTag } from '../../types/verification';
import { commentService } from '../../services/commentService';
import { timeAgo } from '../../utils/timeAgo';

interface CommentsSectionProps {
  verificationId: string;
  verificationTitle?: string;
}

const TAG_CONFIG: Record<
  CommentTag,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  ADDITIONAL_CONTEXT: {
    label: 'Additional Context',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'ℹ️',
  },
  COUNTER_EVIDENCE: {
    label: 'Counter Evidence',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: '🛑',
  },
  LOCAL_REPORT: {
    label: 'Local Eyewitness / Regional Report',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: '📍',
  },
  OFFICIAL_SOURCE: {
    label: 'Official Source / Gazette Update',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '🏛️',
  },
  GENERAL_DISCUSSION: {
    label: 'General Discussion',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: '💬',
  },
};

type SortOption = 'NEWEST' | 'TOP_HELPFUL' | 'SOURCES_ONLY';

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  verificationId,
  verificationTitle,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const user = currentUser;
  const { toast } = useToast();

  const [comments, setComments] = useState<VerificationComment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Comment Form State
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<CommentTag>('ADDITIONAL_CONTEXT');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [showSourceInput, setShowSourceInput] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');

  // Active Reply Form State
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // UI Filters
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('ALL');

  // Load comments
  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      if (!verificationId) return;
      setIsLoading(true);
      try {
        const data = await commentService.getComments(verificationId);
        if (isMounted) {
          setComments(data);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [verificationId]);

  const effectiveUserId = useMemo(() => {
    return user?.id || user?.email || (typeof window !== 'undefined' ? localStorage.getItem('verifai_guest_id') || `guest_${Math.random().toString(36).slice(2, 8)}` : 'guest');
  }, [user]);

  // Persist guest ID in browser for like consistency
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('verifai_guest_id')) {
      localStorage.setItem('verifai_guest_id', effectiveUserId);
    }
  }, [effectiveUserId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed) {
      toast.warning('Input Required', 'Please enter a comment or context note before posting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authorName = isAuthenticated
        ? user?.name || user?.email?.split('@')[0] || 'VerifAI Member'
        : guestName.trim() || 'Community Contributor';

      const payload = {
        verificationId,
        userId: effectiveUserId,
        userName: authorName,
        userEmail: user?.email,
        userRole: user?.role === 'ADMIN' ? 'ADMIN' : isAuthenticated ? 'USER' : 'COMMUNITY',
        content: trimmed,
        tag: selectedTag,
        sourceUrl: sourceUrl.trim() || undefined,
      };

      const created = await commentService.postComment(verificationId, payload);
      if (created) {
        setComments((prev) => [created, ...prev]);
        setNewCommentText('');
        setSourceUrl('');
        setShowSourceInput(false);
        toast.success('Comment Shared', 'Your context contribution was posted to the discussion thread.');
      }
    } catch (err: any) {
      toast.error('Submission Failed', err?.response?.data?.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    try {
      // Optimistic update
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const hasLiked = c.likes?.includes(effectiveUserId);
            const newLikes = hasLiked
              ? c.likes.filter((id) => id !== effectiveUserId)
              : [...(c.likes || []), effectiveUserId];
            return {
              ...c,
              likes: newLikes,
              likesCount: newLikes.length,
            };
          }
          return c;
        })
      );

      await commentService.toggleLike(verificationId, commentId, effectiveUserId);
    } catch (err) {
      console.error('Error toggling like:', err);
      // Re-fetch to reconcile on error
      const fresh = await commentService.getComments(verificationId);
      setComments(fresh);
    }
  };

  const handlePostReply = async (commentId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setIsSubmittingReply(true);
    try {
      const authorName = isAuthenticated
        ? user?.name || user?.email?.split('@')[0] || 'VerifAI Member'
        : guestName.trim() || 'Community Contributor';

      const updated = await commentService.postReply(verificationId, commentId, {
        userId: effectiveUserId,
        userName: authorName,
        userEmail: user?.email,
        userRole: user?.role === 'ADMIN' ? 'ADMIN' : isAuthenticated ? 'USER' : 'COMMUNITY',
        content: trimmed,
      });

      if (updated) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
        setReplyText('');
        setReplyingToCommentId(null);
        toast.success('Reply Posted', 'Your reply has been added to the discussion thread.');
      }
    } catch (err: any) {
      toast.error('Reply Failed', 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(verificationId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.info('Comment Deleted', 'The selected comment was removed.');
    } catch (err: any) {
      toast.error('Delete Failed', err?.response?.data?.message || 'Could not delete comment.');
    }
  };

  // Filtered & Sorted Comments
  const displayedComments = useMemo(() => {
    let result = [...comments];

    if (activeTagFilter !== 'ALL') {
      result = result.filter((c) => c.tag === activeTagFilter);
    }

    if (sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'TOP_HELPFUL') {
      result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else if (sortBy === 'SOURCES_ONLY') {
      result = result.filter((c) => !!c.sourceUrl);
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [comments, sortBy, activeTagFilter]);

  const userInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      id="verification-comments-container"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6"
    >
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Community Discussion & Additional Context
              </h3>
              <span
                id="comment-count-badge"
                className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {comments.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Discuss findings, provide eyewitness testimony, or attach corroborating links.
            </p>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              id="sort-newest-btn"
              type="button"
              onClick={() => setSortBy('NEWEST')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'NEWEST'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Newest
            </button>
            <button
              id="sort-helpful-btn"
              type="button"
              onClick={() => setSortBy('TOP_HELPFUL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'TOP_HELPFUL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Most Helpful
            </button>
            <button
              id="sort-sources-btn"
              type="button"
              onClick={() => setSortBy('SOURCES_ONLY')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'SOURCES_ONLY'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              With Links
            </button>
          </div>
        </div>
      </div>

      {/* Tag Filters Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mr-1">
          Topic:
        </span>
        <button
          type="button"
          onClick={() => setActiveTagFilter('ALL')}
          className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
            activeTagFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Topics ({comments.length})
        </button>
        {(Object.keys(TAG_CONFIG) as CommentTag[]).map((tagKey) => {
          const cfg = TAG_CONFIG[tagKey];
          const count = comments.filter((c) => c.tag === tagKey).length;
          const isActive = activeTagFilter === tagKey;
          return (
            <button
              key={tagKey}
              type="button"
              onClick={() => setActiveTagFilter(tagKey)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 font-medium ${
                isActive
                  ? `${cfg.bg} ${cfg.text} border ${cfg.border} font-semibold shadow-xs`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              {count > 0 && <span className="opacity-75 font-bold">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* New Comment Composition Card */}
      <form
        onSubmit={handlePostComment}
        className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Share Context or Corroborating Findings
          </span>
          {!isAuthenticated && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Commenting as community participant
            </span>
          )}
        </div>

        {/* Guest Name Input (if not logged in) */}
        {!isAuthenticated && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              id="guest-name-input"
              type="text"
              placeholder="Your Name or Handle (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        )}

        {/* Comment Textarea */}
        <div className="relative">
          <textarea
            id="comment-textarea"
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Share key context: Are there local updates from regional officials? Counter-evidence or corroborating records? Provide specifics..."
            className="w-full text-xs sm:text-sm p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[75px]"
          />
        </div>

        {/* Tag Selector Chips */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
            Context Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TAG_CONFIG) as CommentTag[]).map((tagKey) => {
              const cfg = TAG_CONFIG[tagKey];
              const isSelected = selectedTag === tagKey;
              return (
                <button
                  key={tagKey}
                  type="button"
                  onClick={() => setSelectedTag(tagKey)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${cfg.bg} ${cfg.text} ${cfg.border} font-bold ring-2 ring-blue-500/20`
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Source URL Input */}
        <div>
          {!showSourceInput ? (
            <button
              id="toggle-source-input-btn"
              type="button"
              onClick={() => setShowSourceInput(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Link2 className="w-3.5 h-3.5" /> + Attach reference source link (gazette, news article, or press statement)
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="source-link-input"
                  type="url"
                  placeholder="https://example.gov.gh/statement"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSourceUrl('');
                  setShowSourceInput(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Comments adhere to community fact-checking standards.
          </p>
          <Button
            id="submit-comment-btn"
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!newCommentText.trim() || isSubmitting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Post Context
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading community findings...</p>
          </div>
        ) : displayedComments.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/80">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              No context notes posted yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Be the first to share additional context, report regional updates, or link supporting verification records.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayedComments.map((comment) => {
              const tagCfg = comment.tag ? TAG_CONFIG[comment.tag] : TAG_CONFIG.GENERAL_DISCUSSION;
              const hasLiked = comment.likes?.includes(effectiveUserId);
              const isAuthor = comment.userId === effectiveUserId || (user?.email && comment.userEmail === user.email);
              const isUserAdmin = user?.role === 'ADMIN';
              const isReplying = replyingToCommentId === comment.id;

              return (
                <motion.div
                  key={comment.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3"
                >
                  {/* Top Bar: Author, Role, Time, Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {userInitials(comment.userName)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {comment.userName}
                          </span>

                          {/* Role Badges */}
                          {comment.userRole === 'ADMIN' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <ShieldCheck className="w-3 h-3" /> VerifAI Admin
                            </span>
                          )}
                          {comment.userRole === 'FACT_CHECKER' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <CheckCircle2 className="w-3 h-3" /> Fact-Checker
                            </span>
                          )}
                          {comment.userRole === 'USER' && (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Verified Member
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Tag Chip */}
                    {comment.tag && (
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${tagCfg.bg} ${tagCfg.text} ${tagCfg.border}`}
                      >
                        <span>{tagCfg.icon}</span>
                        <span>{tagCfg.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line pl-0.5">
                    {comment.content}
                  </p>

                  {/* Attached Citation/Source Link */}
                  {comment.sourceUrl && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider flex-shrink-0">
                          Source Reference:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate font-mono text-[11px]">
                          {comment.sourceDomain || comment.sourceUrl}
                        </span>
                      </div>
                      <a
                        href={comment.sourceUrl.startsWith('http') ? comment.sourceUrl : `https://${comment.sourceUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex-shrink-0 text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 transition-colors"
                      >
                        Visit Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Action Bar (Upvote / Helpful, Reply, Delete) */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      {/* Helpful / Upvote Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(comment.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                          hasLiked
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-3.5 h-3.5 ${
                            hasLiked ? 'fill-blue-600 dark:fill-blue-400 text-blue-600' : ''
                          }`}
                        />
                        <span>Helpful ({comment.likesCount || 0})</span>
                      </button>

                      {/* Reply Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToCommentId(isReplying ? null : comment.id);
                          setReplyText('');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Reply {comment.replies && comment.replies.length > 0 ? `(${comment.replies.length})` : ''}</span>
                      </button>
                    </div>

                    {/* Delete option (Author or Admin) */}
                    {(isAuthor || isUserAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Threaded Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-4 sm:pl-6 border-l-2 border-blue-200 dark:border-blue-900/60 space-y-2.5 pt-1">
                      {comment.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {rep.userName}
                              </span>
                              {rep.userRole === 'ADMIN' && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {timeAgo(rep.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {rep.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Composition Box */}
                  {isReplying && (
                    <div className="pl-4 sm:pl-6 border-l-2 border-blue-300 dark:border-blue-800 pt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${comment.userName}...`}
                          className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyingToCommentId(null);
                            setReplyText('');
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={isSubmittingReply}
                          disabled={!replyText.trim() || isSubmittingReply}
                          onClick={() => handlePostReply(comment.id)}
                          className="text-xs"
                        >
                          Post Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
