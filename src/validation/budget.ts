import { object, refine, number, string } from "superstruct";
import { isInt } from "validator";

export const BudgetCreationData = object({
  stableIncome: refine(number(), "positive", (value) => value >= 0),
});

export const BudgetByDateQueryParamsData = object({
  month: refine(
    string(),
    "int",
    (value) => isInt(value) && parseInt(value) >= 1 && parseInt(value) <= 12
  ),
  year: refine(
    string(),
    "int",
    (value) =>
      isInt(value) && parseInt(value) >= 1970 && parseInt(value) <= 2100
  ),
});
