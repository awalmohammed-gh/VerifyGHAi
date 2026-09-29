import React, { useState, useRef } from 'react';
import { User, Mail, Building, Briefcase, Phone, FileText, Camera, Upload, Trash2, CheckCircle2, ShieldCheck, Sparkles, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const ProfileSettingsTab: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser?.name || '');
  const [email] = useState(currentUser?.email || '');
  const [organization, setOrganization] = useState(currentUser?.organization || '');
  const [roleTitle, setRoleTitle] = useState(currentUser?.roleTitle || 'Fact-Checker / Researcher');
  const [phone, setPhone] = useState(currentUser?.phone || '+233 24 123 4567');
  const [bio, setBio] = useState(
    currentUser?.bio ||
      'Independent digital researcher focused on evaluating online health disinformation and viral social claims.'
  );
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser?.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File Too Large', 'Please select an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarUrl(result);
        toast.success('Avatar Selected', 'New photo ready to save.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Avatar Cleared', 'Initials badge will be used as default.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Validation Error', 'Full Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        organization: organization.trim(),
        roleTitle: roleTitle.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatarUrl,
      });
      toast.success('Profile Updated', 'Your personal details have been saved successfully.');
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (name || currentUser?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full space-y-6 text-left">
      <form onSubmit={handleSaveProfile} className="space-y-6 w-full">
        {/* Avatar & Identity Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full sm:w-auto">
              {/* Avatar Preview */}
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-sm">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                  title="Change avatar photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{name || 'Your Name'}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Identity
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3" />
                    {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Photo
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                  className="text-red-600 hover:bg-red-50"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 text-[11px] text-slate-400">
            Recommended format: JPG, PNG, or WebP. Maximum file size 2MB. Square aspect ratio works best.
          </div>
        </div>

        {/* Personal & Organization Details */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personal & Professional Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details are attached to your submitted fact-checking reports and audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ama Mensah"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Managed by account security; cannot be changed directly."
            />

            <Input
              label="Organization / Affiliation"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Ghana Fact-Checking Alliance, Independent"
              leftIcon={<Building className="w-4 h-4" />}
            />

            <Input
              label="Professional Role / Title"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Investigative Journalist, Lead Auditor"
              leftIcon={<Briefcase className="w-4 h-4" />}
            />

            <div className="md:col-span-2">
              <Input
                label="Phone Number (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="Used for critical security SMS alerts if 2FA is active."
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Bio & Research Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Briefly describe your journalistic or analytical interests..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-slate-400">Brief summary displayed on verified reviewer badges.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
