import { prisma } from "../db";
import { Request, Response } from "express";
import { NotFoundError, BadDataError } from "../error";
import { Request as AuthRequest } from "express-jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { assert } from "superstruct";
import { TransactionCreationData } from "../validation/transaction";

export const createTransaction = async (req: AuthRequest, res: Response) => {
  console.log("createTransaction", req.body, req.auth);

  if (typeof req.body.date === "string") {
    req.body.date = new Date(req.body.date);
  }

  assert(req.body, TransactionCreationData);
  if (req.auth) {
    let transaction;
    try {
      const data: any = {
        name: req.body.name,
        type: req.body.type,
        amount: req.body.amount,
        date: req.body.date,
        budget: { connect: { id: Number(req.params.budget_id) } },
      };

      if (req.body.categoryId) {
        data.budgetCategory = {
          connect: {
            budgetId_categoryId: {
              budgetId: Number(req.params.budget_id),
              categoryId: Number(req.body.categoryId),
            },
          },
        };
      }

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

export const getTransactions = async (req: AuthRequest, res: Response) => {
  console.log("getTransactions", req.auth);
  if (req.auth) {
    const transactions = await prisma.transaction.findMany({
      where: {
        budget: {
          userId: req.auth.id,
          id: Number(req.params.budget_id),
        },
      },
      include: {
        budgetCategory: {
          where: {
            budgetId: Number(req.params.budget_id),
          },
          select: {
            categoryId: true,
          },
        },
      },
    });

    if (!transactions) {
      res.json(null);
      return;
    }

    const transactionsFormated = transactions.map((transaction) => {
      return {
        ...transaction,
        categoryId: transaction.budgetCategory?.categoryId ?? null,
        budgetCategory: undefined,
        budgetCategoryId: undefined,
      };
    });

    res.json(transactionsFormated);
  } else {
    throw new NotFoundError("User not found");
  }
};
