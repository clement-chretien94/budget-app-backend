import { prisma } from "../db";
import { Request, Response } from "express";
import { NotFoundError, BadDataError } from "../error";
import { Request as AuthRequest } from "express-jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { assert } from "superstruct";
import {
  CategoryCreationData,
  AddCategoryToBudgetData,
} from "../validation/category";

export const createCategory = async (req: AuthRequest, res: Response) => {
  console.log("createCategory", req.body, req.auth);
  assert(req.body, CategoryCreationData);
  if (req.auth) {
    let category;
    try {
      category = await prisma.category.create({
        data: {
          name: req.body.name,
          emoji: req.body.emoji,
          color: req.body.color,
        },
      });
    } catch (error) {
      console.log(error);
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.log(error);
        throw new BadDataError(`${error.meta?.target} not unique`);
      }
      throw error;
    }
    res.json(category);
    res.status(201);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const getCategoriesByBudget = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("getCategoriesByBudget", req.auth);
  if (req.auth) {
    const categories = await prisma.category.findMany({
      where: {
        budgets: {
          some: {
            budgetId: Number(req.params.budget_id),
            budget: { userId: req.auth.id },
          },
        },
      },
      include: {
        budgets: {
          where: {
            budgetId: Number(req.params.budget_id),
          },
          select: {
            limitAmount: true,
          },
        },
      },
    });

    if (!categories) {
      res.json(null);
      return;
    }

    const categoriesWithLimit = categories.map((category) => {
      return {
        ...category,
        limitAmount: category.budgets[0]?.limitAmount ?? null,
        budgets: undefined,
      };
    });

    res.json(categoriesWithLimit);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  console.log("getCategories", req.auth);
  if (req.auth) {
    const categories = await prisma.category.findMany();

    if (!categories) {
      res.json(null);
      return;
    }

    res.json(categories);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const addCategoryToBudget = async (req: AuthRequest, res: Response) => {
  console.log("addCategoryToBudget", req.body, req.auth);
  assert(req.body, AddCategoryToBudgetData);

  if (req.auth) {
    let category;
    try {
      category = await prisma.budgetOnCategory.create({
        data: {
          budget: { connect: { id: Number(req.params.budget_id) } },
          category: { connect: { id: Number(req.body.categoryId) } },
          limitAmount: req.body.limitAmount ?? null,
        },
      });
    } catch (error) {
      console.log(error);
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.log(error);
        throw new BadDataError(`${error.meta?.target} not unique`);
      }
      throw error;
    }
    res.json(category);
    res.status(201);
  } else {
    throw new NotFoundError("User not found");
  }
};
