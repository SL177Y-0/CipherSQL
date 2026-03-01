import { test, expect } from '@playwright/test';

test.describe('API Edge Cases', () => {
    test.beforeAll(async ({ request }) => {
        await request.post('http://localhost:4000/api/seed');
    });

    test('health endpoint returns ok', async ({ request }) => {
        const response = await request.get('http://localhost:4000/api/health');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.status).toBe('ok');
    });

    test('assignments list returns array', async ({ request }) => {
        const response = await request.get('http://localhost:4000/api/assignments');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
        expect(data.length).toBeGreaterThan(0);
    });

    test('invalid assignment ID returns 400', async ({ request }) => {
        const response = await request.get('http://localhost:4000/api/assignments/invalid-id');
        expect(response.status()).toBe(400);
    });

    test('nonexistent assignment returns 404', async ({ request }) => {
        const response = await request.get('http://localhost:4000/api/assignments/507f1f77bcf86cd799439011');
        expect(response.status()).toBe(404);
    });

    test('execute rejects empty SQL', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: '' },
        });
        expect(response.status()).toBe(400);
    });

    test('execute rejects INSERT statement', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: "INSERT INTO employees (name) VALUES ('hack')" },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('SELECT');
    });

    test('execute rejects DELETE statement', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: 'DELETE FROM employees' },
        });
        expect(response.status()).toBe(400);
    });

    test('execute rejects DROP TABLE', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: 'DROP TABLE employees' },
        });
        expect(response.status()).toBe(400);
    });

    test('execute rejects multi-statement', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: 'SELECT 1; SELECT 2' },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('single statement');
    });

    test('execute rejects pg_sleep', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: "SELECT pg_sleep(999)" },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('pg_sleep');
    });

    test('execute accepts valid SELECT', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: 'SELECT * FROM employees LIMIT 5' },
        });
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.columns).toBeDefined();
        expect(data.rows).toBeDefined();
        expect(data.rowCount).toBeGreaterThan(0);
        expect(data.executionTime).toBeDefined();
    });

    test('execute accepts WITH (CTE) SELECT', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: 'WITH dept_avg AS (SELECT department_id, AVG(salary) as avg_sal FROM employees GROUP BY department_id) SELECT * FROM dept_avg' },
        });
        expect(response.ok()).toBeTruthy();
    });

    test('execute handles trailing semicolons gracefully', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/execute`, {
            data: { sql: 'SELECT 1;;;' },
        });
        expect(response.ok()).toBeTruthy();
    });

    test('schema endpoint returns tables with columns and rows', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.get(`http://localhost:4000/api/assignments/${id}/schema`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.schemaName).toBe('a_001');
        expect(data.tables.length).toBeGreaterThan(0);
        expect(data.tables[0].columns.length).toBeGreaterThan(0);
        expect(data.tables[0].rows.length).toBeGreaterThan(0);
        expect(data.tables[0].totalRows).toBeGreaterThan(0);
    });

    test('hint endpoint returns hint with checklist', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/hint`, {
            data: { sql: 'SELECT * FROM employees', lastError: '' },
        });
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.hint).toBeDefined();
        expect(data.checklist).toBeDefined();
        expect(Array.isArray(data.checklist)).toBeTruthy();
    });

    test('hint with error context returns relevant hint', async ({ request }) => {
        const assignments = await (await request.get('http://localhost:4000/api/assignments')).json();
        const id = assignments[0]._id;

        const response = await request.post(`http://localhost:4000/api/assignments/${id}/hint`, {
            data: { sql: 'SELECT * FROM employees', lastError: 'column "foo" does not exist' },
        });
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.hint.toLowerCase()).toContain('name');
    });

    test('seed endpoint creates assignments', async ({ request }) => {
        const response = await request.post('http://localhost:4000/api/seed');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.count).toBe(6);
    });
});
