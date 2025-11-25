import {
  object,
  string,
  size,
  refine,
  number,
  date,
  enums,
  optional,
} from "superstruct";
import { isInt } from "validator";

export const TransactionCreationData = object({
  name: size(string(), 1, 50),
  type: enums(["expense", "income"]),
  amount: refine(number(), "positive", (value) => value >= 0),
  date: date(),
  categoryId: optional(
    refine(number(), "int", (value) => Number.isInteger(value) && value > 0)
  ),
});

export const GetTransactionsByBudgetQueryParamsData = object({
  take: optional(refine(string(), "int", (value) => isInt(value))),
});

export const GetTransactionsQueryParamsData = object({
  type: optional(enums(["expense", "income"])),
});
