import { object, string, size, refine, optional, number } from "superstruct";

export const CategoryCreationData = object({
  name: size(string(), 1, 50),
  emoji: size(string(), 1, 50),
  color: size(string(), 1, 50),
  limitAmount: optional(refine(number(), "positive", (value) => value >= 0)),
});

export const AddCategoryToBudgetData = object({
  categoryId: number(),
  limitAmount: optional(refine(number(), "positive", (value) => value >= 0)),
});
