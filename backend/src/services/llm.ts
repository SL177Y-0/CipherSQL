// hint generation — uses mock hints for now
// swap in openai/gemini api calls for production

interface HintRequest {
  question: string;
  schema: string;
  sql?: string;
  lastError?: string;
}

interface HintResponse {
  hint: string;
  level: number;
  checklist: string[];
}

function containsSolution(text: string): boolean {
  const patterns = [
    /SELECT\s+.+\s+FROM\s+.+\s+(?:WHERE|JOIN|GROUP BY|ORDER BY|HAVING)/i,
    /;\s*$/,
    /```sql/i,
    /```/,
  ];
  return patterns.some(p => p.test(text));
}

function generateContextualHint(sql?: string, lastError?: string): HintResponse {
  const hints: HintResponse[] = [];

  if (lastError) {
    const err = lastError.toLowerCase();

    if (err.includes('syntax')) {
      hints.push({
        hint: "Looks like a syntax issue. Check for missing commas, unmatched parentheses, or keywords in the wrong order.",
        level: 1,
        checklist: [
          "Are all parentheses balanced?",
          "Is every column separated by a comma?",
          "String values need single quotes, not double",
        ]
      });
    } else if (err.includes('does not exist') || err.includes('not found')) {
      hints.push({
        hint: "Something wasn't found — check the Schema panel for the exact table and column names.",
        level: 1,
        checklist: [
          "Check the Schema panel for table names",
          "Make sure column names match exactly",
          "Aliases need to be defined before you use them",
        ]
      });
    } else if (err.includes('group')) {
      hints.push({
        hint: "When you use aggregate functions (COUNT, SUM, etc.), every other column in SELECT needs to be in GROUP BY.",
        level: 2,
        checklist: [
          "List non-aggregated columns in GROUP BY",
          "Column references should match between SELECT and GROUP BY",
          "Use HAVING instead of WHERE to filter on aggregates",
        ]
      });
    } else if (err.includes('timeout')) {
      hints.push({
        hint: "Query is taking too long. Add a WHERE clause to narrow things down, or use LIMIT.",
        level: 1,
        checklist: [
          "Add WHERE to filter rows",
          "Use LIMIT to cap output",
          "Avoid joining too many tables without conditions",
        ]
      });
    }
  }

  if (sql) {
    const lower = sql.toLowerCase();
    if (!lower.includes('join') && !lower.includes('from')) {
      hints.push({
        hint: "Start with the FROM clause — which table has the data you need?",
        level: 1,
        checklist: [
          "Figure out which table has your data",
          "Check if you need data from multiple tables",
          "Pick the right JOIN type if so",
        ]
      });
    }
    if (lower.includes('window') || lower.includes('rank') || lower.includes('row_number')) {
      hints.push({
        hint: "Window functions need PARTITION BY for grouping and ORDER BY inside the OVER clause.",
        level: 2,
        checklist: [
          "Define PARTITION BY column(s)",
          "Set ORDER BY in the OVER clause",
          "Wrap in a subquery if you need to filter by rank",
        ]
      });
    }
  }

  if (hints.length === 0) {
    hints.push({
      hint: "Try using an aggregate function like SUM() or AVG(). You might need GROUP BY too.",
      level: 1,
      checklist: [
        "Are you grouping by the right column?",
        "Did you add the aggregate in SELECT?",
        "Check your JOIN conditions if using multiple tables",
      ]
    });
  }

  return hints[0];
}

// simple in-memory rate limiter
const hintRequests = new Map<string, number[]>();
const RATE_WINDOW = 60000; // 1 min
const RATE_MAX = 5;

export function checkHintRateLimit(clientId: string): boolean {
  const now = Date.now();
  const requests = hintRequests.get(clientId) || [];
  const recent = requests.filter(t => now - t < RATE_WINDOW);

  if (recent.length >= RATE_MAX) return false;

  recent.push(now);
  hintRequests.set(clientId, recent);
  return true;
}

export async function getHint(question: string, schema: string, sql?: string, lastError?: string): Promise<HintResponse> {
  // TODO: hook up real openai/gemini api here
  const hint = generateContextualHint(sql, lastError);

  // safety check — don't accidentally give away the answer
  if (containsSolution(hint.hint)) {
    return {
      hint: "Think about which tables you need and what conditions to apply. Try breaking it into smaller steps.",
      level: 1,
      checklist: [
        "What tables do you need?",
        "What filters should you use?",
        "Do you need grouping or sorting?",
      ]
    };
  }

  return hint;
}
