#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loanSchema } from "./schemas.js";
import { postLoan, LoanApiError } from "./client.js";

const server = new McpServer({ name: "loan-engine", version: "0.1.0" });

// Added to every tool description so Claude never does the math itself
const RULE = " All numbers come from the Loan Engine API; never calculate them yourself.";

async function callApi(path: string, body: unknown) {
  try {
    const text = await postLoan(path, body);
    return { content: [{ type: "text" as const, text }] };
  } catch (err) {
    console.error("Loan API call failed:", err);
    const message = err instanceof LoanApiError
      ? `The loan API rejected the request (${err.status}): ${err.body}`
      : "The loan API could not be reached. Try again shortly.";
    return { isError: true, content: [{ type: "text" as const, text: message }] };
  }
}

server.registerTool(
  "compare_loans",
  {
    title: "Compare two loans",
    description:
      "Compare the total interest and total cost of two loan scenarios. " +
      "Use this whenever the user asks which of two loans is cheaper. " +
      "interestDifference = first loan's interest minus second loan's: " +
      "negative means the first loan is cheaper, positive means the second is." +
      RULE,
    inputSchema: { firstLoan: loanSchema, secondLoan: loanSchema },
  },
  async (args) => callApi("/compare", args),
);

await server.connect(new StdioServerTransport());
console.error("loan-engine MCP server running");