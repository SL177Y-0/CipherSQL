import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, RotateCcw, Lightbulb, Play,
    Table2, Code2, AlertCircle, CheckCircle2, Clock,
    ChevronDown, ChevronRight, Copy, Loader2, Database
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { api, AssignmentData, SchemaData, HintData, APIError } from '@/lib/api';

function QuestionPanel({ assignment }: { assignment: AssignmentData }) {
    const [showExpected, setShowExpected] = useState(false);
    const dc: Record<string, string> = {
        Beginner: 'bg-[var(--success-muted)] text-[var(--success)]',
        Intermediate: 'bg-[var(--warning-muted)] text-[var(--warning)]',
        Advanced: 'bg-[var(--error-muted)] text-[var(--error)]',
        Expert: 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]',
        Master: 'bg-[rgba(160,100,255,0.1)] text-[#A064FF]',
    };

    return (
        <div className="h-full overflow-y-auto p-4">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <span className="text-xs font-mono text-[var(--text-muted)] block mb-1">#{assignment.number}</span>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">{assignment.title}</h2>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dc[assignment.difficulty] || ''}`}>{assignment.difficulty}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {assignment.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]">{t}</span>
                    ))}
                </div>
                <div className="mb-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Question</h3>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{assignment.questionMarkdown}</div>
                </div>
                {assignment.requirements.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Requirements</h3>
                        <ul className="space-y-1.5">
                            {assignment.requirements.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                    <CheckCircle2 size={14} className="text-[var(--accent-secondary)] mt-0.5 flex-shrink-0" />
                                    <span>{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {assignment.expectedOutput && (
                    <div>
                        <button onClick={() => setShowExpected(!showExpected)} className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 hover:text-[var(--text-secondary)] transition-colors" id="toggle-expected-output">
                            {showExpected ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Expected Output
                        </button>
                        {showExpected && (
                            <motion.pre initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-lg p-3 overflow-x-auto border border-[var(--border-subtle)]">
                                {assignment.expectedOutput}
                            </motion.pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SchemaPanel({ assignmentId }: { assignmentId: string }) {
    const [schema, setSchema] = useState<SchemaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const d = await api.getSchema(assignmentId);
                if (cancelled) return;
                setSchema(d);
                if (d.tables.length > 0) setExpanded(d.tables[0].tableName);
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Failed to load schema');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [assignmentId]);

    if (loading) return <div className="h-full p-4 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[var(--accent-primary)]" /></div>;
    if (error) return <div className="h-full p-4 flex flex-col items-center justify-center text-center"><AlertCircle size={24} className="text-[var(--error)] mb-2" /><p className="text-sm text-[var(--text-secondary)]">{error}</p></div>;
    if (!schema || schema.tables.length === 0) return <div className="h-full p-4 flex flex-col items-center justify-center text-center"><Database size={24} className="text-[var(--text-muted)] mb-2" /><p className="text-sm text-[var(--text-muted)]">No schema loaded yet.</p></div>;

    return (
        <div className="h-full overflow-y-auto p-4">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Schema — <span className="text-[var(--accent-secondary)]">{schema.schemaName}</span>
            </div>
            {schema.tables.map(t => (
                <div key={t.tableName} className="mb-3">
                    <button onClick={() => setExpanded(expanded === t.tableName ? null : t.tableName)} className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors text-left" id={`schema-table-${t.tableName}`}>
                        <div className="flex items-center gap-2">
                            <Table2 size={14} className="text-[var(--accent-secondary)]" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">{t.tableName}</span>
                            <span className="text-xs text-[var(--text-muted)]">({t.totalRows} rows)</span>
                        </div>
                        {expanded === t.tableName ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
                    </button>
                    {expanded === t.tableName && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                            <div className="p-3 border-b border-[var(--border-subtle)]">
                                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Columns</div>
                                <div className="space-y-1">
                                    {t.columns.map(c => (
                                        <div key={c.column_name} className="flex items-center justify-between text-xs">
                                            <span className="font-mono text-[var(--text-primary)]">{c.column_name}</span>
                                            <span className="text-[var(--text-muted)]">{c.data_type}{c.is_nullable === 'NO' ? '' : '?'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {t.rows.length > 0 && (
                                <div className="p-3">
                                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Sample Data</div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead><tr className="border-b border-[var(--border-subtle)]">
                                                {t.columns.map(c => <th key={c.column_name} className="text-left py-1.5 px-2 text-[var(--text-muted)] font-medium whitespace-nowrap">{c.column_name}</th>)}
                                            </tr></thead>
                                            <tbody>
                                                {t.rows.map((row, i) => (
                                                    <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                                                        {t.columns.map(c => {
                                                            const val = row[c.column_name];
                                                            const display = val === null ? '∅' : String(val);
                                                            return <td key={c.column_name} className={`py-1.5 px-2 whitespace-nowrap font-mono ${val === null ? 'text-[var(--text-disabled)] italic' : 'text-[var(--text-secondary)]'}`}>{display.length > 30 ? display.slice(0, 30) + '…' : display}</td>;
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            ))}
        </div>
    );
}

function ResultsPanel({
    status, results, error, warning, notice, executionTime, rowCount,
}: {
    status: 'idle' | 'running' | 'success' | 'error';
    results: Record<string, any>[];
    error: string;
    warning?: string;
    notice?: string;
    executionTime?: number;
    rowCount?: number;
}) {
    const [copied, setCopied] = useState<string | null>(null);

    function copyCell(val: string) {
        navigator.clipboard.writeText(val);
        setCopied(val);
        setTimeout(() => setCopied(null), 1500);
    }

    if (status === 'idle') return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Code2 size={32} className="text-[var(--text-muted)] mb-3 opacity-50" />
            <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Run your first query</p>
            <p className="text-xs text-[var(--text-disabled)]">Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] text-xs font-mono">Ctrl+Enter</kbd> to execute</p>
        </div>
    );

    if (status === 'running') return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Loader2 size={24} className="animate-spin text-[var(--accent-primary)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Running...</p>
        </div>
    );

    if (status === 'error') return (
        <div className="h-full p-4 overflow-y-auto">
            <div className="bg-[var(--error-muted)] border border-[var(--error)]/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-[var(--error)] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-[var(--error)] mb-1">Query Error</p>
                        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--error)]/10">
                    <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Common fixes:</p>
                    <ul className="text-xs text-[var(--text-muted)] space-y-0.5 list-disc list-inside">
                        <li>Check table and column names</li>
                        <li>Missing FROM clause?</li>
                        <li>Unmatched parentheses or quotes</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const cols = results.length > 0 ? Object.keys(results[0]) : [];
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--success)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{rowCount} row{rowCount !== 1 ? 's' : ''}</span>
                </div>
                {executionTime !== undefined && <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Clock size={12} /><span>{executionTime}ms</span></div>}
            </div>
            {warning && <div className="px-4 py-2 bg-[var(--warning-muted)] border-b border-[var(--warning)]/20 text-xs text-[var(--warning)]">⚠ {warning}</div>}
            {notice && <div className="px-4 py-2 bg-[var(--info-muted)] border-b border-[var(--info)]/20 text-xs text-[var(--info)]">ℹ {notice}</div>}
            {results.length === 0 ? (
                <div className="flex-1 flex items-center justify-center"><p className="text-sm text-[var(--text-muted)]">0 rows returned</p></div>
            ) : (
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[var(--bg-surface)] z-10">
                            <tr>{cols.map(c => <th key={c} className="text-left py-2 px-3 text-xs font-semibold text-[var(--text-muted)] uppercase border-b border-[var(--border-subtle)] whitespace-nowrap">{c}</th>)}</tr>
                        </thead>
                        <tbody>
                            {results.map((row, i) => (
                                <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card)]/30 transition-colors">
                                    {cols.map(c => {
                                        const val = row[c];
                                        const display = val === null ? '∅' : String(val);
                                        const isNum = typeof val === 'number';
                                        return (
                                            <td key={c} onClick={() => copyCell(display)} className={`py-2 px-3 whitespace-nowrap font-mono text-xs cursor-pointer hover:bg-[var(--accent-primary-muted)] transition-colors ${val === null ? 'text-[var(--text-disabled)] italic' : isNum ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-secondary)]'}`} title="Click to copy">
                                                {copied === display ? <span className="text-[var(--success)] flex items-center gap-1"><Copy size={10} /> Copied</span> : display.length > 50 ? display.slice(0, 50) + '…' : display}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function HintPanel({ assignmentId, sql, lastError }: { assignmentId: string; sql: string; lastError: string }) {
    const [hint, setHint] = useState<HintData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function requestHint() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getHint(assignmentId, sql, lastError);
            setHint(data);
        } catch (e: any) {
            setError(e instanceof APIError && e.status === 429 ? 'Too many requests — wait a sec.' : e.message || 'Hint failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-full flex flex-col p-4">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={16} className="text-[var(--accent-secondary)]" />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Hint</h3>
                </div>
                {!hint && !loading && !error && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <Lightbulb size={32} className="text-[var(--accent-secondary)] mb-3 opacity-50" />
                        <p className="text-sm text-[var(--text-muted)] mb-4">Stuck? Get a hint.</p>
                        <motion.button onClick={requestHint} disabled={loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-5 py-2.5 rounded-lg bg-[var(--accent-secondary-muted)] text-[var(--accent-secondary)] text-sm font-medium hover:bg-[var(--accent-secondary-muted)]/80 transition-colors" id="get-hint">Get Hint</motion.button>
                    </div>
                )}
                {loading && <div className="flex-1 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[var(--accent-secondary)]" /></div>}
                {error && <div className="bg-[var(--error-muted)] rounded-lg p-3 mb-3"><p className="text-sm text-[var(--error)]">{error}</p></div>}
                {hint && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-3 border border-[var(--border-subtle)]">
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{hint.hint}</p>
                        </div>
                        {hint.checklist.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Checklist</h4>
                                <ul className="space-y-1.5">{hint.checklist.map((c, i) => <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"><span className="text-[var(--accent-secondary)] mt-0.5">•</span><span>{c}</span></li>)}</ul>
                            </div>
                        )}
                        <motion.button onClick={requestHint} disabled={loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs font-medium hover:text-[var(--text-secondary)] transition-colors border border-[var(--border-subtle)]" id="get-another-hint">Another Hint</motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function AssignmentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState<AssignmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [queryStatus, setQueryStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [queryResults, setQueryResults] = useState<Record<string, any>[]>([]);
    const [queryError, setQueryError] = useState('');
    const [queryWarning, setQueryWarning] = useState<string | undefined>();
    const [queryNotice, setQueryNotice] = useState<string | undefined>();
    const [executionTime, setExecutionTime] = useState<number | undefined>();
    const [rowCount, setRowCount] = useState<number | undefined>();
    const [activeTab, setActiveTab] = useState<'question' | 'schema' | 'editor' | 'results' | 'hint'>('question');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        function check() { setIsMobile(window.innerWidth < 640); }
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.getAssignment(id);
                if (cancelled) return;
                setAssignment(data);
                setCode(`-- ${data.title}\n-- Write your query below\n\nSELECT * FROM employees LIMIT 5;`);
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Failed to load assignment');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const handleRun = useCallback(async () => {
        if (!id || !code.trim()) return;
        setQueryStatus('running');
        setQueryError('');
        setQueryWarning(undefined);
        setQueryNotice(undefined);
        try {
            const r = await api.execute(id, code);
            setQueryResults(r.rows);
            setQueryStatus('success');
            setExecutionTime(r.executionTime);
            setRowCount(r.rowCount);
            setQueryWarning(r.warning);
            setQueryNotice(r.notice);
            if (isMobile) setActiveTab('results');
        } catch (e: any) {
            setQueryStatus('error');
            setQueryError(e.message || 'Query failed');
        }
    }, [id, code, isMobile]);

    const handleReset = useCallback(() => {
        setCode('-- Write your query below\n\nSELECT * FROM employees LIMIT 5;');
        setQueryStatus('idle');
        setQueryResults([]);
        setQueryError('');
        setQueryWarning(undefined);
        setQueryNotice(undefined);
        setExecutionTime(undefined);
        setRowCount(undefined);
    }, []);

    // ctrl+enter shortcut
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleRun();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleRun]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-[var(--bg-root)]"><Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" /></div>;
    if (error || !assignment) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-root)] p-4">
            <AlertCircle size={32} className="text-[var(--error)] mb-4" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Assignment not found</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{error || 'Could not load this assignment.'}</p>
            <motion.button onClick={() => navigate('/')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium" id="go-back">Back to Assignments</motion.button>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-root)]">
            <header className="sticky top-0 z-50 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-shrink-0">
                <div className="h-full px-4 md:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <motion.button onClick={() => navigate('/')} className="p-1.5 hover:bg-[var(--bg-card)] rounded-lg transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} id="back-button">
                            <ArrowLeft size={18} className="text-[var(--text-muted)]" />
                        </motion.button>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">#{assignment.number} — {assignment.title}</div>
                        </div>
                        <div className="hidden md:block px-2 py-0.5 rounded-full bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] text-xs font-semibold flex-shrink-0">{assignment.difficulty}</div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <motion.button onClick={handleReset} className="p-1.5 hover:bg-[var(--bg-card)] rounded-lg transition-colors hidden md:flex" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} id="reset-query" title="Reset">
                            <RotateCcw size={16} className="text-[var(--text-muted)]" />
                        </motion.button>
                        <motion.button onClick={handleRun} disabled={queryStatus === 'running' || !code.trim()} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white font-semibold text-sm hover:bg-[var(--accent-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} id="run-button">
                            {queryStatus === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            {queryStatus === 'running' ? 'Running...' : 'Run'}
                        </motion.button>
                    </div>
                </div>
            </header>

            {isMobile ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex overflow-x-auto flex-shrink-0">
                        {(['question', 'schema', 'editor', 'results', 'hint'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-muted)]'}`} id={`tab-${tab}`}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-hidden pb-14">
                        {activeTab === 'question' && <QuestionPanel assignment={assignment} />}
                        {activeTab === 'schema' && <SchemaPanel assignmentId={id!} />}
                        {activeTab === 'editor' && (
                            <div className="h-full p-4">
                                <div className="h-full rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                                    <Editor height="100%" defaultLanguage="sql" value={code} onChange={v => setCode(v || '')} theme="vs-dark" options={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, wordWrap: 'on' }} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'results' && <ResultsPanel status={queryStatus} results={queryResults} error={queryError} warning={queryWarning} notice={queryNotice} executionTime={executionTime} rowCount={rowCount} />}
                        {activeTab === 'hint' && <HintPanel assignmentId={id!} sql={code} lastError={queryError} />}
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex gap-2 px-4 py-2 z-50">
                        <motion.button onClick={handleRun} disabled={queryStatus === 'running' || !code.trim()} className="flex-1 rounded-lg bg-[var(--accent-primary)] text-white font-semibold text-sm disabled:opacity-50" whileTap={{ scale: 0.95 }}>{queryStatus === 'running' ? 'Running…' : 'Run'}</motion.button>
                        <motion.button onClick={() => setActiveTab('hint')} className="flex-1 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] font-semibold text-sm" whileTap={{ scale: 0.95 }}><Lightbulb size={16} className="inline mr-1" />Hint</motion.button>
                        <motion.button onClick={handleReset} className="w-14 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)]" whileTap={{ scale: 0.95 }}><RotateCcw size={16} className="mx-auto" /></motion.button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-80 xl:w-96 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 flex-shrink-0 overflow-hidden"><QuestionPanel assignment={assignment} /></div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                            <div className="border-b border-[var(--border-subtle)] px-4 h-9 flex items-center bg-[var(--bg-surface)]/50 flex-shrink-0">
                                <span className="text-xs font-semibold text-[var(--text-muted)]">SQL EDITOR</span>
                                <span className="ml-auto text-xs text-[var(--text-disabled)]">Ctrl+Enter to run</span>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Editor height="100%" defaultLanguage="sql" value={code} onChange={v => setCode(v || '')} theme="vs-dark" options={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, wordWrap: 'on', automaticLayout: true }} />
                            </div>
                        </div>
                        <div className="h-[3px] bg-[var(--border-subtle)] cursor-row-resize hover:bg-[var(--accent-primary)] transition-colors flex-shrink-0" />
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[var(--bg-root)]">
                            <div className="border-b border-[var(--border-subtle)] px-4 h-9 flex items-center bg-[var(--bg-surface)]/50 flex-shrink-0">
                                <span className="text-xs font-semibold text-[var(--text-muted)]">RESULTS</span>
                            </div>
                            <div className="flex-1 overflow-hidden"><ResultsPanel status={queryStatus} results={queryResults} error={queryError} warning={queryWarning} notice={queryNotice} executionTime={executionTime} rowCount={rowCount} /></div>
                        </div>
                    </div>
                    <div className="w-80 xl:w-96 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 flex-shrink-0 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-hidden border-b border-[var(--border-subtle)]"><SchemaPanel assignmentId={id!} /></div>
                        <div className="flex-1 overflow-hidden"><HintPanel assignmentId={id!} sql={code} lastError={queryError} /></div>
                    </div>
                </div>
            )}
        </div>
    );
}
