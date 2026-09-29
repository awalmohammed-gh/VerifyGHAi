import React from 'react';
import { ShieldAlert, UserPlus, Globe, CheckCircle, FileText, Clock, Inbox } from 'lucide-react';

export interface RecentActivityItem {
  id: string;
  title: string;
  type: 'VERIFICATION' | 'USER' | 'SOURCE' | 'FLAG' | 'REVIEW';
  timeAgo: string;
  detail?: string;
}

export const RecentActivity: React.FC<{ items?: RecentActivityItem[] }> = ({ items = [] }) => {
  const list = items;

  const typeConfig = {
    FLAG: { icon: ShieldAlert, color: 'text-amber-600 bg-amber-50 border-amber-100', badge: 'warning' as const },
    USER: { icon: UserPlus, color: 'text-blue-600 bg-blue-50 border-blue-100', badge: 'info' as const },
    SOURCE: { icon: Globe, color: 'text-purple-600 bg-purple-50 border-purple-100', badge: 'purple' as const },
    VERIFICATION: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', badge: 'success' as const },
    REVIEW: { icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', badge: 'default' as const },
  };

  if (!list || list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <Inbox className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-700">No recent activity recorded</p>
        <p className="text-xs text-slate-400 mt-0.5">Live platform and audit operations will appear here as they occur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((item) => {
        const config = typeConfig[item.type] || typeConfig.VERIFICATION;
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/60"
          >
            <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800">{item.title}</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium whitespace-nowrap">
                  <Clock className="w-3 h-3" /> {item.timeAgo}
                </span>
              </div>
              {item.detail && <p className="text-slate-500 mt-0.5">{item.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
