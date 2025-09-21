import { prisma } from "../db";
import { Request, Response } from "express";
import { NotFoundError, BadDataError } from "../error";
import { Request as AuthRequest } from "express-jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { assert } from "superstruct";
import { BudgetCreationData } from "../validation/budget";

export const createBudget = async (req: AuthRequest, res: Response) => {
  console.log("createBudget", req.body, req.auth);
  assert(req.body, BudgetCreationData);
  if (req.auth) {
    let budget;
    try {
      budget = await prisma.budget.create({
        data: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          stableIncome: req.body.stableIncome,
          userId: req.auth.id,
        },
      });
    } catch (error) {
      console.log(error);
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadDataError(`${error.meta?.target} not unique`);
      }
      throw error;
    }
    res.json(budget);
    res.status(201);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const getCurrentBudget = async (req: AuthRequest, res: Response) => {
  console.log("getCurrentBudget", req.auth);
  if (req.auth) {
    const budget = await prisma.budget.findFirst({
      where: {
        userId: req.auth.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    });

    if (!budget) {
      res.json(null);
      return;
    }

    res.json(budget);
  } else {
    throw new NotFoundError("User not found");
  }
};
