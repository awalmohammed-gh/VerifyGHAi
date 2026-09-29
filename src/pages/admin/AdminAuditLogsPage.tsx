import React, { useEffect, useState } from 'react';
import {
  Database,
  Search,
  ShieldCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
  Shield,
  FileText
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuditLog } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      l.action.toLowerCase().includes(q) ||
      l.performedByName.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.targetName.toLowerCase().includes(q) ||
      l.targetType.toLowerCase().includes(q);

    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const actionsList = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">System Security Audit Logs</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Immutable chronological record of administrative interventions, score overrides, and registry updates.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Total Log Entries:</span>
            <span className="text-slate-900 font-mono text-sm">{logs.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search action keyword, administrator, target ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Action Types</option>
              {actionsList.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner size="md" label="Loading security audit records..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No audit log records match filter</p>
            <p className="text-xs text-slate-400">Try clearing the action type filter or search term.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Administrator</th>
                    <th className="px-5 py-3.5">Action Executed</th>
                    <th className="px-5 py-3.5">Target Entity</th>
                    <th className="px-5 py-3.5">Operation Details</th>
                    <th className="px-5 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {paginated.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(log.createdAt || log.date).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Admin */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block font-sans">
                          {log.performedByName || log.adminName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {log.performedByRole || 'ADMIN'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {log.action}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block truncate max-w-[140px] font-sans">
                          {log.targetName || log.targetId}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {log.targetType}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 max-w-xs sm:max-w-md">
                        <p className="text-slate-700 font-sans line-clamp-1 text-xs">
                          {log.details}
                        </p>
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Inspect Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong className="text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filtered.length}</strong> log records
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <span className="px-3 py-1 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Event Inspection"
          subtitle={`Event ID: ${selectedLog.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedLog.createdAt || selectedLog.date).toISOString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Action</span>
                <span className="font-bold text-blue-600">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Performed By</span>
                <span className="font-bold text-slate-900">
                  {selectedLog.performedByName || selectedLog.adminName} ({selectedLog.performedByRole || 'ADMIN'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Target Entity</span>
                <span className="font-bold text-slate-900">
                  {selectedLog.targetName} [{selectedLog.targetType}]
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Operation Summary & Justification
              </span>
              <p className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-sans leading-relaxed">
                {selectedLog.details}
              </p>
            </div>

            {selectedLog.metadata && (
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Structured Payload Metadata
                </span>
                <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
