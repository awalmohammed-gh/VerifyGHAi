import React from 'react';
import { Calendar, User, ShieldAlert, FileText, Settings, Globe } from 'lucide-react';
import { AuditLog } from '../../types';
import { Badge } from '../common/Badge';

export const AuditLogTable: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  const getTargetIcon = (type: AuditLog['targetType']) => {
    switch (type) {
      case 'USER':
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      case 'SOURCE':
        return <Globe className="w-3.5 h-3.5 text-purple-600" />;
      case 'SUBMISSION':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      case 'SETTINGS':
        return <Settings className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-750">
          <tr>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Administrator</th>
            <th className="px-4 py-3">Target Entity</th>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {logs.map((log) => {
            const formatted = new Date(log.date).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="font-bold text-slate-900 dark:text-slate-200 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {log.action}
                  </span>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <p className="font-semibold text-slate-900 dark:text-white">{log.adminName}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{log.adminEmail}</span>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    {getTargetIcon(log.targetType)}
                    <span>{log.targetName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase block pl-5">
                    {log.targetType}
                  </span>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono">
                  {formatted}
                </td>

                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-sm">
                  <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
