import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpenText, Edit3, FileText, Loader2, Search, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotesEditorModal from '../components/NotesEditorModal';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const noteValueToText = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(noteValueToText).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value).map(noteValueToText).filter(Boolean).join(' ');

  const text = String(value).trim();
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      return noteValueToText(JSON.parse(text));
    } catch (error) {
      return text.replace(/[{}"]/g, '').replace(/,/g, ' ').trim();
    }
  }

  return text;
};

const MyNotes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { state: { openAuth: true } });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API}/api/notes`);
        setNotes(response.data.notes || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load notes.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return notes;
    return notes.filter((note) => {
      const haystack = [
        note.videoTitle,
        note.channelTitle,
        noteValueToText(note.summary),
        noteValueToText(note.revisionNotes),
        noteValueToText(note.keyPoints),
        noteValueToText(note.importantConcepts),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [notes, searchTerm]);

  const updateNote = async (editedNote) => {
    setSaving(true);
    setStatus('');
    try {
      const response = await axios.put(`${API}/api/notes/${editedNote._id}`, editedNote);
      setNotes((prev) => prev.map((note) => (note._id === editedNote._id ? response.data.note : note)));
      setActiveNote(response.data.note);
      setStatus('Notes updated.');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Could not update notes.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note) => {
    const confirmed = window.confirm('Delete these notes? This cannot be undone.');
    if (!confirmed) return;

    setSaving(true);
    try {
      await axios.delete(`${API}/api/notes/${note._id}`);
      setNotes((prev) => prev.filter((item) => item._id !== note._id));
      setActiveNote(null);
      setStatus('Notes deleted.');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Could not delete notes.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center text-primary-900">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-gradient-hero text-primary-900">
      <Navbar showTimer={false} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-36 pb-16">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-5 border border-primary-500/20">
            <BookOpenText className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-semibold text-primary-800">Saved study notes</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-gradient">My Notes</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl">
            Review, edit, and organize the notes you generated from educational videos.
          </p>
        </motion.header>

       <div className="glass rounded-2xl p-4 sm:p-5 border border-primary-900/10 mb-6">
  <div className="relative">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />

    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search notes by title, topic, or content"
      className="input-modern w-full pr-4"
      style={{ paddingLeft: "3.25rem" }}
    />
  </div>
</div>

        {status && <p className="mb-4 text-sm text-primary-700">{status}</p>}
        {error && <p className="mb-4 text-sm text-accent-700">{error}</p>}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="glass rounded-2xl p-5 border border-primary-900/10 animate-pulse">
                <div className="h-36 skeleton-shimmer rounded-xl mb-4" />
                <div className="h-4 skeleton-shimmer rounded mb-3" />
                <div className="h-4 w-2/3 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
        ) : filteredNotes.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note, index) => (
              <motion.article
                key={note._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass rounded-2xl overflow-hidden border border-primary-900/10 hover:border-primary-500/30 transition-colors"
              >
                {note.thumbnail ? (
                  <img src={note.thumbnail} alt={note.videoTitle} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="aspect-video bg-primary-100/70 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-primary-600" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-slate-500 mb-2">Updated {formatDate(note.updatedAt)}</p>
                  <h2 className="font-bold text-primary-900 line-clamp-2 mb-2">{note.videoTitle}</h2>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">{noteValueToText(note.summary)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveNote(note)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient text-white rounded-full text-sm font-semibold shadow-glow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      View/Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(note)}
                      className="p-2 rounded-full bg-accent-100/80 text-accent-700 border border-accent-500/25"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 sm:p-10 border border-primary-900/10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/80 border border-primary-900/10 flex items-center justify-center mb-4 shadow-glow-sm">
              <BookOpenText className="w-8 h-8 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-primary-900 mb-2">No notes yet. Generate notes from an educational video.</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">Open a study video, generate notes, preview them, and save when they look right.</p>
          </div>
        )}
      </main>

      <NotesEditorModal
        isOpen={Boolean(activeNote)}
        note={activeNote}
        mode="update"
        saving={saving}
        onClose={() => setActiveNote(null)}
        onSave={updateNote}
        onDelete={deleteNote}
      />

      <Footer />
    </motion.div>
  );
};

export default MyNotes;
