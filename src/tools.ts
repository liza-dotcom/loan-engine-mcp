/**
 * Tool handlers for the MCP server. Each one calls the loan-engine API and
 * wraps the reply, or the error, in the result format MCP expects
 * Errors come back as readable results (through isError function) instead of being thrown,
 * so Claude can explain the problem to the user.
 */
import { postLoan, LoanApiError } from "./client.js";

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });
const fail = (text: string): ToolResult => ({ isError: true, content: [{ type: "text", text }] });

function toError(err: unknown): ToolResult {
  console.error("Loan API call failed:", err);
  if (err instanceof LoanApiError) {
    return fail(`The loan API rejected the request (${err.status}): ${err.body}`);
  }
  return fail("The loan API could not be reached. Try again shortly.");
}

export async function compareLoans(args: unknown): Promise<ToolResult> {
  try { return ok(await postLoan("/compare", args)); } catch (e) { return toError(e); }
}

export async function loanSummary(args: unknown): Promise<ToolResult> {
  try { return ok(await postLoan("/summary", args)); } catch (e) { return toError(e); }
}

// maxPeriods is an MCP-only option: it's split off so only the loan fields reach the API.
export async function amortizationSchedule(
  { maxPeriods = 12, ...loan }: { maxPeriods?: number } & Record<string, unknown>,
): Promise<ToolResult> {
  try {

    // A 25-year loan has 300 rows but this send Claude only the first few, plus the total count.
    // Note: parsing here can drop trailing zeros (1234.50 -> 1234.5). Display only.
    const schedule = JSON.parse(await postLoan("/calculate", loan));
    const total = schedule.periods.length;
    const shown = schedule.periods.slice(0, maxPeriods);
    return ok(JSON.stringify({ totalPeriods: total, periodsShown: shown.length, periods: shown }));
  } catch (e) { return toError(e); }
}



