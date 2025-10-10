import { prisma } from "../db";
import { Request, Response } from "express";
import { NotFoundError, BadDataError } from "../error";
import { Request as AuthRequest } from "express-jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { assert } from "superstruct";
import {
  TransactionCreationData,
  GetTransactionsQueryParamsData,
} from "../validation/transaction";

export const createTransaction = async (req: AuthRequest, res: Response) => {
  console.log("createTransaction", req.body, req.auth);

  if (typeof req.body.date === "string") {
    req.body.date = new Date(req.body.date);
  }

  assert(req.body, TransactionCreationData);

  // Determine the budgetId base on req.body.date (month and year)
  const month = req.body.date.getMonth() + 1;
  const year = req.body.date.getFullYear();

  if (req.auth) {
    let budgetId = (
      await prisma.budget.findFirst({
        where: {
          month,
          year,
        },
      })
    )?.id;

    if (!budgetId) {
      res.status(400).json({
        error: "Budget not found for the given date",
        code: "BUDGET_NOT_FOUND",
        message:
          "Vous devez d'abord créer le budget pour ce mois avant d'ajouter une transaction.",
      });
      return;
    }

    let transaction;
    try {
      const data: any = {
        name: req.body.name,
        type: req.body.type,
        amount: req.body.amount,
        date: req.body.date,
        budget: { connect: { id: budgetId } },
      };

      const budgetOnCategory = await prisma.budgetOnCategory.findUnique({
        where: {
          budgetId_categoryId: {
            budgetId: budgetId,
            categoryId: Number(req.body.categoryId),
          },
        },
      });

      if (!budgetOnCategory) {
        res.status(400).json({
          error: "Category not found in the budget for the given date",
          code: "CATEGORY_NOT_FOUND_IN_BUDGET",
          message:
            "La catégorie spécifiée n'existe pas pour le budget de ce mois.",
        });
        return;
      }

      data.budgetCategory = {
        connect: {
          budgetId_categoryId: {
            budgetId: budgetId,
            categoryId: Number(req.body.categoryId),
          },
        },
      };

      transaction = await prisma.transaction.create({ data });
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
    res.json(transaction);
    res.status(201);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const getTransactionsByBudget = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("getTransactionsByBudget", req.auth);
  assert(req.query, GetTransactionsQueryParamsData);
  if (req.auth) {
    const transactions = await prisma.transaction.findMany({
      take: Number(req.query.take) || undefined,
      where: {
        budget: {
          userId: req.auth.id,
          id: Number(req.params.budget_id),
        },
      },
      include: {
        budgetCategory: {
          select: {
            categoryId: true,
            category: {
              select: {
                name: true,
                emoji: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    if (!transactions) {
      res.json(null);
      return;
    }

    const transactionsFormated = transactions.map((transaction) => {
      return {
        ...transaction,
        categoryId: transaction.budgetCategory?.categoryId ?? null,
        categoryName: transaction.budgetCategory?.category?.name ?? null,
        categoryEmoji: transaction.budgetCategory?.category?.emoji ?? null,
        budgetCategory: undefined,
        budgetCategoryId: undefined,
      };
    });

    res.json(transactionsFormated);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  console.log("getTransactions", req.auth);
  assert(req.query, GetTransactionsQueryParamsData);
  if (req.auth) {
    const transactions = await prisma.transaction.findMany({
      take: Number(req.query.take) || undefined,
      include: {
        budgetCategory: {
          select: {
            categoryId: true,
            category: {
              select: {
                name: true,
                emoji: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    if (!transactions) {
      res.json(null);
      return;
    }

    const transactionsFormated = transactions.map((transaction) => {
      return {
        ...transaction,
        categoryId: transaction.budgetCategory?.categoryId ?? null,
        categoryName: transaction.budgetCategory?.category?.name ?? null,
        categoryEmoji: transaction.budgetCategory?.category?.emoji ?? null,
        budgetCategory: undefined,
        budgetCategoryId: undefined,
      };
    });

    res.json(transactionsFormated);
  } else {
    throw new NotFoundError("User not found");
  }
};
