/**
 * HTTP client for the loan-engine API.
 * LOAN_API_URL points at the deployed API and falls back to a local Docker copy if deployed url isnt reached.
 * The API errors (400/500) become LoanApiError so tools can tell them apart from network failures and timeouts.
 */

const BASE_URL = process.env.LOAN_API_URL ?? "http://localhost:8080";
try {
  new URL(BASE_URL);
} catch {
  console.error(`LOAN_API_URL is not a valid URL: "${BASE_URL}". It must start with http:// or https://`);
  process.exit(1);
}
console.error(`Using loan API at ${BASE_URL}`);
export class LoanApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Loan API returned ${status}`);
  }
}

export async function postLoan(path: string, body: unknown): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/loans${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  if (!res.ok) throw new LoanApiError(res.status, text);

// Return raw text, not parsed JSON so that it keeps BigDecimal values exactly as Java sent them
  return text;
}