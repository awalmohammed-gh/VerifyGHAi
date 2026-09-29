import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface ResultDistributionProps {
  verified: number;
  trusted: number;
  suspicious: number;
  fake: number;
}

export const ResultDistributionChart: React.FC<ResultDistributionProps> = ({
  verified = 18,
  trusted = 12,
  suspicious = 8,
  fake = 4,
}) => {
  const total = verified + trusted + suspicious + fake;

  const data = [
    { name: 'Verified', value: verified, color: '#16a34a' },
    { name: 'Trusted', value: trusted, color: '#2563eb' },
    { name: 'Suspicious', value: suspicious, color: '#f59e0b' },
    { name: 'Fake', value: fake, color: '#dc2626' },
  ].filter((item) => item.value > 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Result Distribution</h3>
        <p className="text-[11px] text-slate-500">Breakdown of your personal verification outcomes</p>
      </div>

      {total === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No verification data to display yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-900">{total}</span>
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                Total
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700 font-medium">Verified</span>
              </div>
              <span className="font-bold text-slate-900">
                {verified} ({total > 0 ? Math.round((verified / total) * 100) : 0}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-700 font-medium">Trusted</span>
              </div>
              <span className="font-bold text-slate-900">
                {trusted} ({total > 0 ? Math.round((trusted / total) * 100) : 0}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700 font-medium">Suspicious</span>
              </div>
              <span className="font-bold text-slate-900">
                {suspicious} ({total > 0 ? Math.round((suspicious / total) * 100) : 0}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-slate-700 font-medium">Fake</span>
              </div>
              <span className="font-bold text-slate-900">
                {fake} ({total > 0 ? Math.round((fake / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
