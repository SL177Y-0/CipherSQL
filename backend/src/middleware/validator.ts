import { Parser } from 'node-sql-parser';

const BLOCKED_KEYWORDS = [
  'pg_sleep', 'pg_read_file', 'pg_write_file', 'lo_import', 'lo_export',
  'dblink', 'copy', 'insert', 'update', 'delete', 'drop', 'alter',
  'create', 'truncate', 'grant', 'revoke', 'set role', 'reset role',
  'do ', 'call ', 'execute', 'prepare'
];

const BLOCKED_FUNCTIONS = [
  'pg_sleep', 'pg_read_file', 'pg_write_file', 'lo_import', 'lo_export',
  'pg_ls_dir', 'pg_stat_file', 'pg_read_binary_file'
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedSQL?: string;
}

export function validateSQL(sql: string): ValidationResult {
  if (!sql || sql.trim().length === 0) {
    return { isValid: false, error: 'Query cannot be empty.' };
  }

  const trimmedSQL = sql.trim();
  const cleanSQL = trimmedSQL.replace(/;+\s*$/, '');

  // no multi-statement queries
  if (cleanSQL.includes(';')) {
    return { isValid: false, error: 'Only one statement at a time.' };
  }

  // reject control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(cleanSQL)) {
    return { isValid: false, error: 'Query contains invalid characters.' };
  }

  // parse into AST and check it's a SELECT
  const parser = new Parser();
  try {
    const ast = parser.astify(cleanSQL, { database: 'PostgresQL' });
    const astArray = Array.isArray(ast) ? ast : [ast];

    if (astArray.length !== 1) {
      return { isValid: false, error: 'Only one statement allowed.' };
    }

    const stmt = astArray[0] as any;
    if (stmt.type !== 'select') {
      return { isValid: false, error: 'Only SELECT queries are allowed here.' };
    }

    // make sure CTEs are also selects
    if (stmt.with) {
      for (const cte of stmt.with) {
        if (cte.stmt && cte.stmt.type && cte.stmt.type !== 'select') {
          return { isValid: false, error: 'CTE must be a SELECT.' };
        }
      }
    }
  } catch (err: any) {
    let msg = err.message || 'Unknown syntax error';
    const match = msg.match(/Syntax error.*$/m);
    if (match) msg = match[0];
    return { isValid: false, error: 'SQL Syntax Error: ' + msg };
  }

  // keyword denylist
  const sqlLower = cleanSQL.toLowerCase().replace(/\s+/g, ' ');
  for (const word of BLOCKED_KEYWORDS) {
    if (sqlLower.includes(word)) {
      return { isValid: false, error: `Blocked keyword: "${word}"` };
    }
  }

  // function denylist
  for (const func of BLOCKED_FUNCTIONS) {
    const funcRegex = new RegExp(`\\b${func}\\s*\\(`, 'i');
    if (funcRegex.test(cleanSQL)) {
      return { isValid: false, error: `Blocked function: "${func}"` };
    }
  }

  return { isValid: true, sanitizedSQL: cleanSQL };
}

// turn pg error codes into something a student can understand
export function mapPGError(err: any): string {
  const code = err.code;
  const msg = err.message || '';

  switch (code) {
    case '42P01':
      return `Table not found. ${extractMissing(msg, 'relation')}`;
    case '42703':
      return `Column not found. ${extractMissing(msg, 'column')}`;
    case '42601':
      return `Syntax error near: ${extractPosition(msg)}`;
    case '42803':
      return 'Grouping error: non-aggregated column without GROUP BY.';
    case '42883':
      return `Unknown function. ${extractMissing(msg, 'function')}`;
    case '57014':
      return 'Query timed out. Try adding WHERE or LIMIT.';
    case '55P03':
      return 'Lock timeout — database is busy, try again.';
    case '25006':
      return 'Write operations not allowed. SELECT only.';
    default:
      if (msg.includes('statement timeout')) return 'Query timed out.';
      if (msg.includes('does not exist')) return 'Table or column not found. Check for typos.';
      if (msg.includes('permission denied')) return 'Permission denied. SELECT only.';
      return `Query error: ${msg}`;
  }
}

function extractMissing(msg: string, type: string): string {
  const match = msg.match(new RegExp(`${type} "([^"]+)" does not exist`));
  return match ? `"${match[1]}" doesn't exist. Check for typos.` : 'Check for typos.';
}

function extractPosition(msg: string): string {
  const match = msg.match(/at or near "([^"]+)"/);
  return match ? `"${match[1]}"` : 'check your query.';
}
