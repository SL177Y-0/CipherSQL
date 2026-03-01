import { Router, Request, Response } from 'express';
import { adminPool, studentPool } from '../db/pg';
import { Assignment } from '../models/Assignment';
import { Attempt } from '../models/Attempt';
import { validateSQL, mapPGError } from '../middleware/validator';
import { getHint, checkHintRateLimit } from '../services/llm';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// seed sample assignments into mongo
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    await Assignment.deleteMany({});
    await Attempt.deleteMany({});

    const assignments = [
      {
        number: '001',
        title: 'Basic SELECT Query',
        difficulty: 'Beginner',
        description: 'Write a simple SELECT query to retrieve all employees from a table.',
        questionMarkdown: `Write a SQL query to retrieve **all employees** from the \`employees\` table.\n\nYour result should include all columns: \`id\`, \`name\`, \`email\`, \`salary\`, \`department_id\`, and \`hire_date\`.`,
        schemaName: 'a_001',
        tags: ['SELECT'],
        estimatedTime: '5 min',
        attempts: 1247,
        completionPercentage: 92,
        requirements: [
          'Use SELECT to retrieve all columns',
          'Query the employees table',
          'No filtering needed - return all rows',
        ],
        expectedOutput: `id | name    | email              | salary  | department_id | hire_date\n1  | Alice   | alice@example.com  | 120000  | 1             | 2020-01-15\n2  | Bob     | bob@example.com    | 95000   | 1             | 2021-03-10\n3  | Charlie | charlie@example.com| 110000  | 2             | 2019-11-01`,
      },
      {
        number: '002',
        title: 'Employee Salary Analysis',
        difficulty: 'Intermediate',
        description: 'Find the top 5 highest-paid employees in each department using window functions.',
        questionMarkdown: `Write a SQL query to find the **top 5 highest-paid employees** in each department.\n\nYour result should include:\n- Department name\n- Employee name\n- Salary\n- Rank within the department\n\nThe employees should be ranked by salary in descending order within each department.`,
        schemaName: 'a_001',
        tags: ['SELECT', 'JOIN', 'Window Functions'],
        estimatedTime: '15 min',
        attempts: 892,
        completionPercentage: 65,
        requirements: [
          'Use RANK() or DENSE_RANK() window function',
          'Group results by department',
          'Return exactly 5 employees per department',
          'Order by salary descending within each department',
          'Include departments with fewer than 5 employees',
        ],
        expectedOutput: `department_name | name     | salary  | rank\nEngineering    | Eve      | 130000  | 1\nEngineering    | Alice    | 120000  | 2\nEngineering    | Bob      | 95000   | 3\nSales          | Charlie  | 110000  | 1\nSales          | David    | 85000   | 2`,
      },
      {
        number: '003',
        title: 'Customer Order Join',
        difficulty: 'Beginner',
        description: 'Join employees and departments tables to find employee department details.',
        questionMarkdown: `Write a SQL query to **join the employees and departments tables** to find each employee along with their department details.\n\nYour result should include:\n- Employee name\n- Salary\n- Department name\n- Department budget`,
        schemaName: 'a_001',
        tags: ['SELECT', 'JOIN'],
        estimatedTime: '10 min',
        attempts: 2156,
        completionPercentage: 78,
        requirements: [
          'Join employees with departments on department_id',
          'Return employee name, salary, department name, and budget',
          'Include all employees even if they have no department (LEFT JOIN)',
        ],
        expectedOutput: `name    | salary  | department_name | budget\nAlice   | 120000  | Engineering     | 1000000\nBob     | 95000   | Engineering     | 1000000\nCharlie | 110000  | Sales           | 500000`,
      },
      {
        number: '004',
        title: 'Aggregate Sales Report',
        difficulty: 'Intermediate',
        description: 'Group by department and calculate total salary, count, and averages.',
        questionMarkdown: `Write a SQL query to generate a **salary report by department**.\n\nFor each department, calculate:\n- Total salary\n- Number of employees\n- Average salary\n- Maximum salary`,
        schemaName: 'a_001',
        tags: ['SELECT', 'Aggregation', 'GROUP BY'],
        estimatedTime: '12 min',
        attempts: 654,
        completionPercentage: 45,
        requirements: [
          'Group results by department',
          'Calculate SUM, COUNT, AVG, and MAX for salary',
          'Join with departments table for department names',
          'Round average salary to 2 decimal places',
        ],
        expectedOutput: `department_name | total_salary | employee_count | avg_salary | max_salary\nEngineering    | 345000       | 3              | 115000.00  | 130000\nSales          | 195000       | 2              | 97500.00   | 110000`,
      },
      {
        number: '005',
        title: 'Complex Subquery Analysis',
        difficulty: 'Advanced',
        description: 'Use subqueries to find employees earning above department averages.',
        questionMarkdown: `Write a SQL query to find all employees who earn **above the average salary** of their department.\n\nYour result should include:\n- Employee name\n- Employee salary\n- Department name\n- Department average salary`,
        schemaName: 'a_001',
        tags: ['SELECT', 'Subquery', 'GROUP BY'],
        estimatedTime: '20 min',
        attempts: 438,
        completionPercentage: 35,
        requirements: [
          'Calculate the average salary per department',
          'Compare each employee salary against their department average',
          'Use a subquery or CTE for the department averages',
          'Return only employees above the average',
        ],
        expectedOutput: `name    | salary  | department_name | dept_avg_salary\nAlice   | 120000  | Engineering     | 115000\nEve     | 130000  | Engineering     | 115000\nCharlie | 110000  | Sales           | 97500`,
      },
      {
        number: '006',
        title: 'CTE and Derived Tables',
        difficulty: 'Advanced',
        description: 'Build a CTE to perform multi-step salary analysis.',
        questionMarkdown: `Using a **Common Table Expression (CTE)**, write a query that:\n\n1. First calculates the department salary statistics\n2. Then joins with individual employees\n3. Classifies each employee as 'Above Average', 'Average', or 'Below Average'`,
        schemaName: 'a_001',
        tags: ['CTE', 'SELECT'],
        estimatedTime: '25 min',
        attempts: 267,
        completionPercentage: 28,
        requirements: [
          'Use WITH clause to define a CTE',
          'CTE should compute department averages',
          'Main query should join CTE with employees',
          'Add a CASE expression for salary classification',
        ],
        expectedOutput: `name    | salary  | department_name | classification\nEve     | 130000  | Engineering     | Above Average\nAlice   | 120000  | Engineering     | Above Average\nBob     | 95000   | Engineering     | Below Average`,
      },
    ];

    const created = await Assignment.insertMany(assignments);
    res.json({ message: 'Seeded successfully', count: created.length, assignments: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Seed failed: ' + err.message });
  }
});

router.get('/assignments', async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find({}).sort({ number: 1 });
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load assignments.' });
  }
});

router.get('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    res.json(assignment);
  } catch (err: any) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid assignment ID format.' });
    }
    res.status(500).json({ error: 'Failed to load assignment.' });
  }
});

// fetch table structure + sample data for an assignment's pg schema
router.get('/assignments/:id/schema', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const schemaName = assignment.schemaName;

    const tablesResult = await adminPool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [schemaName]
    );

    if (tablesResult.rows.length === 0) {
      return res.json({ schemaName, tables: [], message: 'No tables found in this schema.' });
    }

    const tables = [];
    for (const row of tablesResult.rows) {
      const cols = await adminPool.query(
        `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [schemaName, row.table_name]
      );

      const sampleData = await adminPool.query(
        `SELECT * FROM "${schemaName}"."${row.table_name}" LIMIT 10`
      );

      const countResult = await adminPool.query(
        `SELECT COUNT(*) as total FROM "${schemaName}"."${row.table_name}"`
      );

      tables.push({
        tableName: row.table_name,
        columns: cols.rows,
        rows: sampleData.rows,
        totalRows: parseInt(countResult.rows[0].total, 10),
      });
    }

    res.json({ schemaName, tables });
  } catch (err: any) {
    console.error('Schema fetch error:', err);
    res.status(500).json({ error: 'Failed to load schema.' });
  }
});

// run a student's SQL query in the sandbox
router.post('/assignments/:id/execute', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const { sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query is required.' });
    }

    const validation = validateSQL(sql);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const sanitizedSQL = validation.sanitizedSQL || sql.trim();
    const client = await studentPool.connect();

    try {
      await client.query('BEGIN READ ONLY');
      await client.query(`SET search_path TO "${assignment.schemaName}"`);
      await client.query(`SET statement_timeout = 10000`);
      await client.query(`SET lock_timeout = 5000`);
      await client.query(`SET idle_in_transaction_session_timeout = 5000`);

      const wrappedSQL = `SELECT * FROM (${sanitizedSQL}) AS _q LIMIT 200`;
      const start = Date.now();
      const result = await client.query(wrappedSQL);
      const executionTime = Date.now() - start;

      await client.query('COMMIT');

      // log attempt in the background, don't block response
      Attempt.create({
        assignmentId: assignment._id,
        queryText: sanitizedSQL,
        status: 'success',
        executionTime,
        rowCount: result.rowCount,
      }).catch(() => { });

      Assignment.updateOne({ _id: assignment._id }, { $inc: { attempts: 1 } }).catch(() => { });

      const response: any = {
        columns: result.fields.map(f => f.name),
        rows: result.rows,
        rowCount: result.rowCount || 0,
        executionTime,
      };

      if (result.rowCount && result.rowCount >= 200) {
        response.warning = 'Results truncated to 200 rows.';
      }
      if (!result.rowCount || result.rowCount === 0) {
        response.notice = 'Query returned 0 rows. Check your WHERE clause.';
      }

      res.json(response);
    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => { });
      const friendlyError = mapPGError(err);

      Attempt.create({
        assignmentId: assignment._id,
        queryText: sanitizedSQL,
        status: err.message?.includes('timeout') ? 'timeout' : 'error',
        error: friendlyError,
      }).catch(() => { });

      res.status(400).json({ error: friendlyError });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Execute error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid assignment ID format.' });
    }
    res.status(500).json({ error: 'Something went wrong running your query.' });
  }
});

router.post('/assignments/:id/hint', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const clientId = req.ip || 'unknown';
    if (!checkHintRateLimit(clientId)) {
      return res.status(429).json({ error: 'Too many requests. Wait a bit.' });
    }

    const { sql, lastError } = req.body;
    const hint = await getHint(
      assignment.questionMarkdown,
      assignment.schemaName,
      sql,
      lastError
    );

    res.json(hint);
  } catch (err: any) {
    console.error('Hint error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid assignment ID format.' });
    }
    res.status(500).json({
      error: 'Could not generate a hint right now.',
      hint: 'Try reviewing the question and schema carefully.',
      checklist: ['Re-read the requirements', 'Check the schema panel', 'Look for common SQL patterns'],
    });
  }
});

router.get('/assignments/:id/attempts', async (req: Request, res: Response) => {
  try {
    const attempts = await Attempt.find({ assignmentId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(attempts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load attempts.' });
  }
});

export default router;
