import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { AlertItem, Priority } from '../../types';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<AlertItem>) => void;
  initialData?: AlertItem | null;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [targetAudience, setTargetAudience] = useState('ALL_USERS');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setSeverity((initialData.severity as any) || 'HIGH');
      setTargetAudience(initialData.targetAudience || 'ALL_USERS');
    } else {
      setTitle('');
      setDescription('');
      setSeverity('HIGH');
      setTargetAudience('ALL_USERS');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      severity,
      targetAudience,
      isActive: true,
      createdBy: 'Admin Desk',
      type: 'SYSTEM_WARNING',
      isDismissed: false,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Misinformation Advisory' : 'Broadcast Public Safety Advisory'}
      subtitle="Publish a visible warning across the platform to alert citizens of viral hoaxes."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Input
          label="Advisory Title"
          placeholder="e.g. URGENT: Fake Yellow Fever SMS Campaign Detected"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Severity Level"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            options={[
              { value: 'CRITICAL', label: 'CRITICAL (Emergency)' },
              { value: 'HIGH', label: 'HIGH (Significant Virality)' },
              { value: 'MEDIUM', label: 'MEDIUM (Emerging Misinformation)' },
              { value: 'LOW', label: 'LOW (Informational Advisory)' },
            ]}
          />

          <Select
            label="Target Audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            options={[
              { value: 'ALL_USERS', label: 'All Registered Citizens & Public' },
              { value: 'RESEARCHERS', label: 'Researchers & Fact-Checkers' },
              { value: 'JOURNALISTS', label: 'Media Partners & Journalists' },
            ]}
          />
        </div>

        <Textarea
          label="Advisory Details & Official Refutation"
          placeholder="Specify what the hoax claims, why it is harmful, and provide official rebuttal statements..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          showCharCount={false}
          required
        />

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit">
            {initialData ? 'Update Advisory' : 'Broadcast Advisory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
