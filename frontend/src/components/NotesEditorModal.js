import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clipboard, Download, Loader2, Save, X } from 'lucide-react';

const listToText = (items) => (Array.isArray(items) ? items.join('\n') : items || '');
const textToList = (text) =>
  String(text || '')
    .split('\n')
    .map((item) => item.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean);

export const noteToText = (note) =>
  [
    `Title: ${note.videoTitle || 'Study Notes'}`,
    '',
    'Short Summary',
    note.summary || '',
    '',
    'Key Points',
    listToText(note.keyPoints)
      .split('\n')
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join('\n'),
    '',
    'Important Concepts',
    listToText(note.importantConcepts)
      .split('\n')
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join('\n'),
    '',
    'Revision Notes',
    note.revisionNotes || '',
    '',
    'Quick Recap',
    note.quickRecap || '',
    '',
    'Suggested Follow-up Topics',
    listToText(note.suggestedFollowUpTopics)
      .split('\n')
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join('\n'),
  ].join('\n');

const NotesEditorModal = ({ isOpen, note, mode = 'save', saving = false, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!note) return;
    setForm({
      ...note,
      keyPointsText: listToText(note.keyPoints),
      importantConceptsText: listToText(note.importantConcepts),
      suggestedFollowUpTopicsText: listToText(note.suggestedFollowUpTopics),
    });
    setCopied(false);
  }, [note, isOpen]);

  const noteText = useMemo(() => {
    if (!form) return '';
    return noteToText({
      ...form,
      keyPoints: textToList(form.keyPointsText),
      importantConcepts: textToList(form.importantConceptsText),
      suggestedFollowUpTopics: textToList(form.suggestedFollowUpTopicsText),
    });
  }, [form]);

  if (!isOpen || !form) return null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave({
      ...form,
      keyPoints: textToList(form.keyPointsText),
      importantConcepts: textToList(form.importantConceptsText),
      suggestedFollowUpTopics: textToList(form.suggestedFollowUpTopicsText),
    });
  };

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(noteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.warn('[NOTES] Copy failed:', error.message);
    }
  };

  const downloadNotes = () => {
    const blob = new Blob([noteText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(form.videoTitle || 'study-notes').replace(/[^\w\s-]/g, '').trim() || 'study-notes'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-primary-900/45 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden glass-dark rounded-2xl border border-primary-900/10 shadow-glow"
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-primary-900/10">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes Preview</p>
              <h2 className="text-xl font-bold text-primary-900 truncate">{form.videoTitle || 'Study Notes'}</h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 transition-colors" aria-label="Close notes">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-156px)] p-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-primary-900">Short Summary</span>
              <textarea className="input-modern mt-2 w-full min-h-[96px]" value={form.summary || ''} onChange={(e) => updateField('summary', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-primary-900">Key Points</span>
              <textarea className="input-modern mt-2 w-full min-h-[120px]" value={form.keyPointsText} onChange={(e) => updateField('keyPointsText', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-primary-900">Important Concepts</span>
              <textarea className="input-modern mt-2 w-full min-h-[96px]" value={form.importantConceptsText} onChange={(e) => updateField('importantConceptsText', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-primary-900">Revision Notes</span>
              <textarea className="input-modern mt-2 w-full min-h-[120px]" value={form.revisionNotes || ''} onChange={(e) => updateField('revisionNotes', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-primary-900">Quick Recap</span>
              <textarea className="input-modern mt-2 w-full min-h-[80px]" value={form.quickRecap || ''} onChange={(e) => updateField('quickRecap', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-primary-900">Suggested Follow-up Topics</span>
              <textarea className="input-modern mt-2 w-full min-h-[80px]" value={form.suggestedFollowUpTopicsText} onChange={(e) => updateField('suggestedFollowUpTopicsText', e.target.value)} />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-primary-900/10">
            <div className="flex items-center gap-2">
              <button type="button" onClick={copyNotes} className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-900/10 text-sm font-semibold">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={downloadNotes} className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-900/10 text-sm font-semibold">
                <Download className="w-4 h-4" />
                Download
              </button>
              {onDelete && (
                <button type="button" onClick={() => onDelete(form)} className="px-4 py-2 rounded-full bg-accent-100/80 border border-accent-500/25 text-sm font-semibold text-accent-700">
                  Delete
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient text-white rounded-full font-bold shadow-glow-sm disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {mode === 'update' ? 'Update Notes' : 'Save Notes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotesEditorModal;
