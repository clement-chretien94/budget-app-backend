import { object, string, size, refine, number, date, enums } from "superstruct";

export const TransactionCreationData = object({
  name: size(string(), 1, 50),
  type: enums(["expense", "income"]),
  amount: refine(number(), "positive", (value) => value >= 0),
  date: date(),
  categoryId: refine(
    number(),
    "int",
    (value) => Number.isInteger(value) && value > 0
  ),
});
