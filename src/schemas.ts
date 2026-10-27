import { z } from "zod";

/**
 * Input schema for one loan and all three MCP tools share this.
 * Same as the validation on LoanRequest.java in loan-engine, so bad input
 * is rejected here before it ever reaches the API.
 * The .describe() text is written for Claude, it's how the model knows
 * how to fill each field (e.g. 25 years -> termMonths: 300)
 */

export const loanSchema = z.object({
  principal: z.number().min(0.01).max(100_000_000)
    .describe("Loan amount in dollars, e.g. 400000"),
  annualInterestRate: z.number().min(0).max(100)
    .describe("Annual rate as a percent: 4.5 means 4.5%"),
  termMonths: z.number().int().min(1).max(360)
    .describe("Loan length in months: 25 years = 300"),
  loanType: z.enum(["FIXED", "VARIABLE", "INTEREST_ONLY"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    .describe("Optional start date, YYYY-MM-DD"),
  rateChangeSchedule: z.array(z.object({
    effectiveMonth: z.number().int().min(1),
    newAnnualRate: z.number().min(0).max(100),
  })).optional()
    .describe("VARIABLE loans only: the month each new rate starts"),
  interestOnlyMonths: z.number().int().min(0).optional()
    .describe("INTEREST_ONLY loans only: months before principal payments start"),
});   
