import { object, refine, number, string } from "superstruct";
import { isInt } from "validator";

export const BudgetCreationData = object({
  month: refine(
    number(),
    "int",
    (value) => Number.isInteger(value) && value >= 1 && value <= 12
  ),
  year: refine(
    number(),
    "int",
    (value) => Number.isInteger(value) && value >= 1970 && value <= 2100
  ),
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
