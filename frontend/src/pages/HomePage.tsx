import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Search, SearchX, Clock, Users, ChevronRight, Sparkles, Zap, BookOpen, ArrowRight, X } from 'lucide-react';
import { api, AssignmentData } from '@/lib/api';

function Header() {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-[16px] border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-root)]/50">
            <div className="h-14 md:h-16 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database size={16} className="text-[var(--accent-secondary)]" />
                    <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">CipherSQL</span>
                    <span className="text-lg font-medium text-[var(--text-muted)]">Studio</span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]">
                        Assignments
                    </span>
                </div>
            </div>
        </header>
    );
}

function Hero({ onStartClick, assignmentCount }: { onStartClick: () => void; assignmentCount: number }) {
    return (
        <section className="relative py-16 md:py-20 px-4 md:px-8 overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--accent-primary)] blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[var(--accent-secondary)] blur-[100px]" />
            </div>
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary-muted)] border border-[var(--border-accent)] mb-6">
                        <Sparkles size={14} className="text-[var(--accent-primary)]" />
                        <span className="text-xs font-semibold text-[var(--accent-primary)]">SQL Practice Sandbox</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        Master SQL with{' '}
                        <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                            Real Challenges
                        </span>
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                        Practice real-world SQL queries in a secure sandbox. Run against live PostgreSQL, get instant feedback, and master database skills.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-4 md:gap-6 mb-10 max-w-lg mx-auto">
                    {[
                        { icon: BookOpen, label: 'Challenges', value: assignmentCount > 0 ? `${assignmentCount}` : '—' },
                        { icon: Database, label: 'Live DB', value: 'PostgreSQL' },
                        { icon: Zap, label: 'Execution', value: 'Real-time' },
                    ].map((stat, i) => (
                        <div key={i} className="p-3 md:p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 hover:border-[var(--border-strong)] transition-colors">
                            <stat.icon size={20} className="mx-auto mb-2 text-[var(--accent-primary)]" />
                            <div className="text-xs text-[var(--text-muted)] mb-1">{stat.label}</div>
                            <div className="text-sm md:text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
                        </div>
                    ))}
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onStartClick}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary-hover)] transition-colors"
                    id="start-practicing"
                >
                    Start Practicing
                    <ArrowRight size={18} />
                </motion.button>
            </div>
        </section>
    );
}

function AssignmentCard({ assignment, onClick }: { assignment: AssignmentData; onClick: () => void }) {
    const diffColors: Record<string, string> = {
        Beginner: 'bg-[var(--success-muted)] text-[var(--success)]',
        Intermediate: 'bg-[var(--warning-muted)] text-[var(--warning)]',
        Advanced: 'bg-[var(--error-muted)] text-[var(--error)]',
        Expert: 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]',
        Master: 'bg-[rgba(160,100,255,0.1)] text-[#A064FF]',
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ translateY: -4 }}
            className="w-full p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-left transition-all group"
            id={`assignment-card-${assignment.number}`}
        >
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-[var(--text-muted)]">#{assignment.number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${diffColors[assignment.difficulty] || ''}`}>
                    {assignment.difficulty}
                </span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{assignment.title}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{assignment.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
                {assignment.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded text-xs bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]">{tag}</span>
                ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{assignment.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{assignment.attempts.toLocaleString()} attempts</span>
                </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Start challenge</span>
                <ChevronRight size={14} />
            </div>
        </motion.button>
    );
}

function FilterBar({
    searchQuery, onSearch,
    selectedDifficulty, onDifficultyChange,
    selectedTags, onTagChange,
    allTags,
}: {
    searchQuery: string; onSearch: (q: string) => void;
    selectedDifficulty: string; onDifficultyChange: (d: string) => void;
    selectedTags: string[]; onTagChange: (t: string[]) => void;
    allTags: string[];
}) {
    const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

    return (
        <div className="px-4 md:px-8 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearch(e.target.value)}
                        placeholder="Search assignments..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                        id="search-input"
                    />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {difficulties.map(d => (
                        <button
                            key={d}
                            onClick={() => onDifficultyChange(d)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedDifficulty === d
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                                }`}
                            id={`filter-${d.toLowerCase().replace(' ', '-')}`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {allTags.slice(0, 6).map(tag => (
                        <button
                            key={tag}
                            onClick={() => {
                                if (selectedTags.includes(tag)) {
                                    onTagChange(selectedTags.filter(t => t !== tag));
                                } else {
                                    onTagChange([...selectedTags, tag]);
                                }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedTags.includes(tag)
                                ? 'bg-[var(--accent-secondary)] text-[var(--bg-root)]'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Footer() {
    return (
        <footer className="border-t border-[var(--border-subtle)] py-6 md:py-8 px-4 md:px-8 bg-gradient-to-b from-[var(--bg-surface)]/30 to-[var(--bg-root)] mt-8">
            <div className="max-w-6xl mx-auto flex items-center justify-center">
                <p className="text-xs text-[var(--text-muted)]">&copy; 2026 CipherSQL Studio</p>
            </div>
        </footer>
    );
}

function SkeletonCard() {
    return (
        <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50">
            <div className="flex justify-between mb-3">
                <div className="w-8 h-4 skeleton-loading rounded" />
                <div className="w-16 h-5 skeleton-loading rounded-full" />
            </div>
            <div className="w-3/4 h-5 skeleton-loading rounded mb-2" />
            <div className="w-full h-3 skeleton-loading rounded mb-1" />
            <div className="w-2/3 h-3 skeleton-loading rounded mb-3" />
            <div className="flex gap-1.5 mb-3">
                <div className="w-14 h-5 skeleton-loading rounded" />
                <div className="w-10 h-5 skeleton-loading rounded" />
            </div>
            <div className="flex justify-between">
                <div className="w-16 h-3 skeleton-loading rounded" />
                <div className="w-20 h-3 skeleton-loading rounded" />
            </div>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--error-muted)] flex items-center justify-center mx-auto mb-4">
                    <X size={24} className="text-[var(--error)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Something went wrong</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">{message}</p>
                <motion.button
                    onClick={onRetry} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-primary-hover)] transition-colors"
                    id="retry-button"
                >
                    Try Again
                </motion.button>
            </motion.div>
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<AssignmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    async function loadAssignments() {
        setLoading(true);
        setError(null);
        try {
            let data = await api.getAssignments();
            if (data.length === 0) {
                await api.seed();
                data = await api.getAssignments();
            }
            setAssignments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadAssignments(); }, []);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        assignments.forEach(a => a.tags.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [assignments]);

    const filtered = useMemo(() => {
        return assignments.filter(a => {
            if (selectedDifficulty !== 'All Levels' && a.difficulty !== selectedDifficulty) return false;
            if (selectedTags.length > 0 && !selectedTags.some(tag => a.tags.includes(tag))) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [assignments, selectedDifficulty, selectedTags, searchQuery]);

    function goToAssignment(a: AssignmentData) {
        navigate(`/assignment/${a._id}`);
    }

    return (
        <div className="min-h-screen bg-[var(--bg-root)] flex flex-col">
            <Header />
            <Hero onStartClick={() => { if (assignments.length > 0) goToAssignment(assignments[0]); }} assignmentCount={assignments.length} />
            <FilterBar searchQuery={searchQuery} onSearch={setSearchQuery} selectedDifficulty={selectedDifficulty} onDifficultyChange={setSelectedDifficulty} selectedTags={selectedTags} onTagChange={setSelectedTags} allTags={allTags} />

            <main className="flex-1">
                {loading ? (
                    <div className="px-4 md:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={loadAssignments} />
                ) : filtered.length > 0 ? (
                    <div className="px-4 md:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" id="assignments-grid">
                            {filtered.map((assignment, i) => (
                                <motion.div key={assignment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                    <AssignmentCard assignment={assignment} onClick={() => goToAssignment(assignment)} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                            <SearchX size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No assignments found</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">Try adjusting your filters or search terms.</p>
                            <motion.button
                                onClick={() => { setSelectedDifficulty('All Levels'); setSelectedTags([]); setSearchQuery(''); }}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 rounded-lg border border-[var(--border-strong)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-card)] transition-colors"
                                id="clear-filters"
                            >
                                Clear Filters
                            </motion.button>
                        </motion.div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
