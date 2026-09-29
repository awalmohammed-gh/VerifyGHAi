import React from 'react';
import { Sun, Moon, Monitor, CheckCircle2, Sparkles, Eye, Palette, ShieldCheck, Check } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export const AppearanceSettingsTab: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const label = newTheme === 'system' ? 'System Synchronized' : newTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
    toast.success('Appearance Updated', `Switched theme to ${label}.`);
  };

  const themes: {
    id: Theme;
    title: string;
    description: string;
    icon: React.ElementType;
    previewBg: string;
    previewBorder: string;
    previewText: string;
  }[] = [
    {
      id: 'light',
      title: 'Light Mode',
      description: 'Crisp, high-contrast daylight theme with clean white surfaces and sharp typography.',
      icon: Sun,
      previewBg: 'bg-slate-50',
      previewBorder: 'border-slate-200',
      previewText: 'text-slate-900',
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      description: 'Eye-friendly deep twilight palette optimized for low-light research and reduced eye strain.',
      icon: Moon,
      previewBg: 'bg-slate-900',
      previewBorder: 'border-slate-800',
      previewText: 'text-white',
    },
    {
      id: 'system',
      title: 'System Synchronized',
      description: 'Automatically detects and follows your operating system or browser theme preferences.',
      icon: Monitor,
      previewBg: 'bg-gradient-to-r from-slate-100 to-slate-900',
      previewBorder: 'border-blue-300 dark:border-blue-600',
      previewText: 'text-slate-800 dark:text-slate-100',
    },
  ];

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-2 transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Theme & Visual Experience</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize your interface appearance. Changes take effect instantly and persist across sessions.
        </p>
      </div>

      {/* Theme Selection Grid */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Color Theme Preference</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active mode: <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{actualTheme}</span>{' '}
              {theme === 'system' && '(Auto OS Sync)'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Switch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            const Icon = t.icon;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border text-left transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                }`}
              >
                {/* Active Check Indicator */}
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Card Icon & Header */}
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {t.title}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </div>

                {/* Mini Preview Box */}
                <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 w-full">
                  <div
                    className={`h-12 rounded-xl p-2.5 flex items-center justify-between border ${
                      t.id === 'light'
                        ? 'bg-white border-slate-200 text-slate-900'
                        : t.id === 'dark'
                        ? 'bg-slate-950 border-slate-800 text-slate-100'
                        : 'bg-gradient-to-r from-white to-slate-950 border-slate-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          t.id === 'light' ? 'bg-blue-600' : t.id === 'dark' ? 'bg-blue-400' : 'bg-indigo-500'
                        }`}
                      />
                      <span className="text-[10px] font-bold font-mono">
                        {t.id === 'light' ? 'Light Preview' : t.id === 'dark' ? 'Dark Preview' : 'Auto Preview'}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        t.id === 'light'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.id === 'dark'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      VERIFIED
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Verification Preview Component */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live Credibility Card Preview</h4>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                VERIFIED SOURCE
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Ministry of Health Ghana</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Credibility: 96 / 100</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            "National malaria vaccination campaign begins across selected health centers in Ashanti and Greater Accra regions."
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Corroborated by Ghana Health Service gazette and official press release</span>
          </div>
        </div>
      </div>
    </div>
  );
};
