import React, { useState } from 'react';
import { FactCheck, Verdict } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

export interface FactCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FactCheck, 'id' | 'date'>) => void;
  isLoading?: boolean;
}

export const FactCheckModal: React.FC<FactCheckModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [claim, setClaim] = useState('');
  const [verdict, setVerdict] = useState<Verdict>('FALSE');
  const [source, setSource] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('Policy, Health');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      claim,
      verdict,
      source,
      evidenceUrl: evidenceUrl || undefined,
      notes,
      verifiedBy: 'Admin Desk',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Verified Fact-Check to Knowledge Base"
      subtitle="Register an investigated claim with primary evidence links and verdicts"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Textarea
          label="Investigated Claim"
          placeholder="State the exact claim or rumor statement that was fact-checked..."
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          rows={3}
          showCharCount={false}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Verdict"
            value={verdict}
            onChange={(e) => setVerdict(e.target.value as Verdict)}
            options={[
              { value: 'FALSE', label: 'FALSE' },
              { value: 'MISLEADING', label: 'MISLEADING' },
              { value: 'TRUE', label: 'TRUE' },
              { value: 'UNVERIFIED', label: 'UNVERIFIED' },
            ]}
          />

          <Input
            label="Authoritative Source / Refuting Body"
            placeholder="e.g. Ministry of Health Gazette #2026"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            required
          />
        </div>

        <Input
          label="Evidence Document / Primary Web URL"
          placeholder="https://official-gazette.gov.gh/releases/clarification"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
        />

        <Textarea
          label="Summary & Contextual Evidence Notes"
          placeholder="Explain the background evidence and why this verdict was issued..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          showCharCount={false}
          required
        />

        <Input
          label="Category Tags (comma-separated)"
          placeholder="Health, Policy, Economy"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Save Fact-Check
          </Button>
        </div>
      </form>
    </Modal>
  );
};
