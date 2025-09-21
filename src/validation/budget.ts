import { object, refine, number } from "superstruct";

export const BudgetCreationData = object({
  stableIncome: refine(number(), "positive", (value) => value >= 0),
});
