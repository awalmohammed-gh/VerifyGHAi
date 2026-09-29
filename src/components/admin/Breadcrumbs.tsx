import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  customCrumbs?: Array<{ label: string; path?: string }>;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customCrumbs }) => {
  const location = useLocation();

  if (customCrumbs) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500">
        <ol className="flex items-center space-x-1.5 flex-wrap">
          <li>
            <Link to="/admin" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </li>
          {customCrumbs.map((crumb, idx) => (
            <li key={idx} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3 h-3 text-slate-400" />
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-blue-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Automatic path generator
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/^[a-z]/, (c) => c.toUpperCase());
    return { label: formatted, path: index === pathSegments.length - 1 ? undefined : path };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500">
      <ol className="flex items-center space-x-1.5 flex-wrap">
        {crumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center space-x-1.5">
            {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
            {crumb.path ? (
              <Link to={crumb.path} className="hover:text-blue-600 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-bold text-slate-900">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
