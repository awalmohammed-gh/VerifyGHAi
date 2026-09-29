import React from 'react';
import { Link } from 'react-router-dom';
import { User, Bell, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import { ProfileSettingsTab } from '../../components/settings/ProfileSettingsTab';
import { Button } from '../../components/common/Button';

export const ProfilePage: React.FC = () => {
  return (
    <div className="w-full flex-1 flex flex-col justify-start items-start text-left space-y-6">
      {/* Header with Quick Tab Links */}
      <div className="w-full rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                My Profile
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your personal identity, avatar, affiliation, and reviewer bio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/settings?tab=account">
              <Button variant="outline" size="sm" leftIcon={<Shield className="w-3.5 h-3.5" />}>
                Security & Password
              </Button>
            </Link>
            <Link to="/settings?tab=notifications">
              <Button variant="outline" size="sm" leftIcon={<Bell className="w-3.5 h-3.5" />}>
                Alerts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Form Pane */}
      <div className="w-full flex-1 flex flex-col justify-start items-start text-left">
        <ProfileSettingsTab />
      </div>
    </div>
  );
};
