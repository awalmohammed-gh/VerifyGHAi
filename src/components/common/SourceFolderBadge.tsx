import React from 'react';
import {
  Building2,
  Newspaper,
  Share2,
  GraduationCap,
  PenTool,
  MessageSquare,
  Folder,
} from 'lucide-react';
import {
  SourceFolderCategory,
  SourceFolderInfo,
  FOLDER_METADATA,
  categorizeSourceDomain,
} from '../../utils/domainCategorizer';

export interface SourceFolderBadgeProps {
  category?: SourceFolderCategory;
  folderInfo?: SourceFolderInfo;
  url?: string;
  domain?: string;
  sourceName?: string;
  contentType?: string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showDomain?: boolean;
  className?: string;
}

export const SourceFolderBadge: React.FC<SourceFolderBadgeProps> = ({
  category,
  folderInfo,
  url,
  domain,
  sourceName,
  contentType,
  size = 'sm',
  showIcon = true,
  showDomain = false,
  className = '',
}) => {
  const resolvedInfo: SourceFolderInfo =
    folderInfo ||
    (category ? FOLDER_METADATA[category] : categorizeSourceDomain({ url, domain, sourceName, contentType }));

  const renderIcon = (iconName: string, iconClass: string) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className={iconClass} />;
      case 'Newspaper':
        return <Newspaper className={iconClass} />;
      case 'Share2':
        return <Share2 className={iconClass} />;
      case 'GraduationCap':
        return <GraduationCap className={iconClass} />;
      case 'PenTool':
        return <PenTool className={iconClass} />;
      case 'MessageSquare':
        return <MessageSquare className={iconClass} />;
      default:
        return <Folder className={iconClass} />;
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1 rounded-md font-bold',
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-bold',
    md: 'px-3 py-1.5 text-xs gap-2 rounded-xl font-bold',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center border transition-colors ${resolvedInfo.badgeBg} ${resolvedInfo.badgeText} ${resolvedInfo.badgeBorder} ${sizeClasses[size]} ${className}`}
      title={`Auto-categorized folder: ${resolvedInfo.name} (${resolvedInfo.description})`}
    >
      {showIcon && renderIcon(resolvedInfo.iconName, `${iconSizes[size]} flex-shrink-0`)}
      <span>{resolvedInfo.shortLabel}</span>
      {showDomain && domain && (
        <span className="opacity-70 font-mono text-[10px] ml-0.5">({domain})</span>
      )}
    </span>
  );
};
