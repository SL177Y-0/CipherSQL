const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export interface AssignmentData {
    _id: string;
    number: string;
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
    description: string;
    questionMarkdown: string;
    schemaName: string;
    tags: string[];
    estimatedTime: string;
    attempts: number;
    completionPercentage: number;
    requirements: string[];
    expectedOutput: string;
}

export interface SchemaTable {
    tableName: string;
    columns: {
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
    }[];
    rows: Record<string, any>[];
    totalRows: number;
}

export interface SchemaData {
    schemaName: string;
    tables: SchemaTable[];
    message?: string;
}

export interface ExecuteResult {
    columns: string[];
    rows: Record<string, any>[];
    rowCount: number;
    executionTime: number;
    warning?: string;
    notice?: string;
}

export interface HintData {
    hint: string;
    level?: number;
    checklist: string[];
}

export class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'APIError';
    }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(`${API_BASE}${url}`, {
            ...options,
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...options?.headers },
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new APIError(data.error || `Error ${res.status}`, res.status);
        }

        return res.json();
    } catch (err: any) {
        if (err.name === 'AbortError') throw new APIError('Request timed out', 408);
        if (err instanceof APIError) throw err;
        throw new APIError('Network error — is the backend running?', 0);
    } finally {
        clearTimeout(timeout);
    }
}

export const api = {
    health: () => request<{ status: string }>('/health'),
    seed: () => request<{ message: string; count: number }>('/seed', { method: 'POST' }),

    getAssignments: () => request<AssignmentData[]>('/assignments'),
    getAssignment: (id: string) => request<AssignmentData>(`/assignments/${id}`),
    getSchema: (id: string) => request<SchemaData>(`/assignments/${id}/schema`),

    execute: (id: string, sql: string) =>
        request<ExecuteResult>(`/assignments/${id}/execute`, {
            method: 'POST',
            body: JSON.stringify({ sql }),
        }),

    getHint: (id: string, sql?: string, lastError?: string) =>
        request<HintData>(`/assignments/${id}/hint`, {
            method: 'POST',
            body: JSON.stringify({ sql, lastError }),
        }),

    getAttempts: (id: string) => request<any[]>(`/assignments/${id}/attempts`),
};
