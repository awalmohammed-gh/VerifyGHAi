import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  HelpCircle,
  Palette,
  ChevronRight,
  Sliders,
  SlidersHorizontal,
  Cpu,
} from 'lucide-react';
import { ProfileSettingsTab } from '../../components/settings/ProfileSettingsTab';
import { NotificationsSettingsTab } from '../../components/settings/NotificationsSettingsTab';
import { AccountSettingsTab } from '../../components/settings/AccountSettingsTab';
import { HelpGuideSettingsTab } from '../../components/settings/HelpGuideSettingsTab';
import { AppearanceSettingsTab } from '../../components/settings/AppearanceSettingsTab';
import { AiEngineSettingsTab } from '../../components/settings/AiEngineSettingsTab';

export type SettingsTabKey = 'profile' | 'engine' | 'appearance' | 'notifications' | 'account' | 'help';

interface TabItem {
  key: SettingsTabKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  {
    key: 'profile',
    label: 'Profile',
    description: 'Personal details, avatar, bio & role',
    icon: User,
  },
  {
    key: 'engine',
    label: 'AI & Sensitivity',
    description: 'Confidence thresholds & verification modes',
    icon: SlidersHorizontal,
  },
  {
    key: 'appearance',
    label: 'Appearance',
    description: 'Dark mode, light mode & theme setup',
    icon: Palette,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Alert channels & detection thresholds',
    icon: Bell,
  },
  {
    key: 'account',
    label: 'Account & Security',
    description: 'Password, 2FA & account lifecycle',
    icon: Shield,
  },
  {
    key: 'help',
    label: 'Help Guide',
    description: 'FAQs & documentation',
    icon: HelpCircle,
  },
];

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as SettingsTabKey | null;

  const validTabs: SettingsTabKey[] = ['profile', 'engine', 'appearance', 'notifications', 'account', 'help'];

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(
    urlTab && validTabs.includes(urlTab)
      ? urlTab
      : 'profile'
  );

  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (key: SettingsTabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-start items-start text-left space-y-6">
      {/* Header Banner */}
      <div className="w-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Settings & Preferences
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage your personal credentials, color theme, alert channels, security parameters, and help guide.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>VerifAI Portal v2.4</span>
          </div>
        </div>

        {/* Navigation & Tab Architecture */}
        <div className="pt-6">
          {/* Mobile Select Dropdown (<648px) */}
          <div className="block sm:hidden pb-1">
            <label htmlFor="mobile-settings-tab" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Select Module Tab
            </label>
            <select
              id="mobile-settings-tab"
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value as SettingsTabKey)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TABS.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label} — {tab.description}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop & Scrollable Tablet/Mobile Tab Bar */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <nav
              className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 min-w-max sm:min-w-0"
              aria-label="Settings Tabs"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs border border-slate-200/90 dark:border-slate-600 ring-1 ring-slate-900/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content Panes */}
      <div className="w-full flex-1 flex flex-col justify-start items-start text-left">
        {activeTab === 'profile' && <ProfileSettingsTab />}
        {activeTab === 'engine' && <AiEngineSettingsTab />}
        {activeTab === 'appearance' && <AppearanceSettingsTab />}
        {activeTab === 'notifications' && <NotificationsSettingsTab />}
        {activeTab === 'account' && <AccountSettingsTab />}
        {activeTab === 'help' && <HelpGuideSettingsTab />}
      </div>
    </div>
  );
};
