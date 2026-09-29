import React, { useState, useEffect } from 'react';
import { Source, SourceStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

export interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (source: Partial<Source>) => void;
  initialData?: Source | null;
  isLoading?: boolean;
}

export const SourceModal: React.FC<SourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState<SourceStatus>('TRUSTED');
  const [credibilityScore, setCredibilityScore] = useState(80);
  const [country, setCountry] = useState('Ghana');
  const [category, setCategory] = useState('General News');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDomain(initialData.domain);
      setStatus(initialData.status);
      setCredibilityScore(initialData.credibilityScore);
      setCountry(initialData.country);
      setCategory(initialData.category);
      setDescription(initialData.description);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setDomain('');
      setStatus('TRUSTED');
      setCredibilityScore(80);
      setCountry('Ghana');
      setCategory('General News');
      setDescription('');
      setNotes('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      domain,
      status,
      credibilityScore: Number(credibilityScore),
      country,
      category,
      description,
      notes,
      isArchived: false,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Source Profile' : 'Add New Source to Credibility Registry'}
      subtitle="Configure domain trust scoring, historical status, and investigative metadata"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Source / Publisher Name"
            placeholder="e.g. Daily Graphic Online"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Domain Name"
            placeholder="e.g. graphic.com.gh"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SourceStatus)}
            options={[
              { value: 'VERIFIED', label: 'VERIFIED' },
              { value: 'TRUSTED', label: 'TRUSTED' },
              { value: 'UNKNOWN', label: 'UNKNOWN' },
              { value: 'SUSPICIOUS', label: 'SUSPICIOUS' },
              { value: 'UNRELIABLE', label: 'UNRELIABLE' },
            ]}
          />

          <Input
            label="Credibility Score (0-100)"
            type="number"
            min="0"
            max="100"
            value={credibilityScore}
            onChange={(e) => setCredibilityScore(Number(e.target.value))}
            required
          />

          <Input
            label="Country / Region"
            placeholder="e.g. Ghana"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </div>

        <Input
          label="Category"
          placeholder="e.g. Mainstream Journalism, Health NGO, Academic"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <Textarea
          label="Description & Editorial Background"
          placeholder="Describe publisher history, editorial board, and correction policies..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          showCharCount={false}
          required
        />

        <Textarea
          label="Internal Administrator Notes"
          placeholder="Internal notes, WHOIS details, or investigation tickets..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          showCharCount={false}
        />

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Register Source'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
