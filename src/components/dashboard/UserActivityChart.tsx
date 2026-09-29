import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { verificationService } from '../../services/verificationService';

export interface UserActivityChartProps {
  checksCount?: number;
  initialData?: { name: string; checked: number; suspicious: number }[];
}

export const UserActivityChart: React.FC<UserActivityChartProps> = ({ initialData }) => {
  const [period, setPeriod] = useState<'7D' | '30D' | '90D'>('7D');
  const [chartData, setChartData] = useState<{ name: string; checked: number; suspicious: number }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setChartData(initialData);
      return;
    }

    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        // Query recent history from verification service
        const history = await verificationService.getHistory();
        const days = period === '7D' ? 7 : period === '30D' ? 30 : 90;
        const now = new Date();

        const bucketMap: Record<string, { name: string; checked: number; suspicious: number }> = {};

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split('T')[0];
          const label =
            period === '7D'
              ? d.toLocaleDateString('en-US', { weekday: 'short' })
              : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
          bucketMap[key] = { name: label, checked: 0, suspicious: 0 };
        }

        history.forEach((item) => {
          const itemDate = new Date(item.createdAt || Date.now()).toISOString().split('T')[0];
          if (bucketMap[itemDate]) {
            bucketMap[itemDate].checked += 1;
            const cls = item.result?.classification;
            if (cls === 'SUSPICIOUS' || cls === 'FAKE') {
              bucketMap[itemDate].suspicious += 1;
            }
          }
        });

        setChartData(Object.values(bucketMap));
      } catch (err) {
        console.warn('[UserActivityChart] Failed to load activity history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [period, initialData]);

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verification Activity</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Live personal claim analysis volume</p>
        </div>

        {/* Timeframe Selector (7D / 30D / 90D) */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
          {(['7D', '30D', '90D'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                period === p
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p === '7D' ? '7 Days' : p === '30D' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Loading activity trend...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '11px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#93c5fd' }}
              />
              <Bar dataKey="checked" name="Verified Claims" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="suspicious" name="Suspicious / Fake" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center gap-5 pt-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
          <span>Total Checked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
          <span>Flags / Suspicious</span>
        </div>
      </div>
    </div>
  );
};
