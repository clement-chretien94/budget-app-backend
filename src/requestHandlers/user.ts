import { prisma } from "../db";
import { Request, Response } from "express";
import { NotFoundError, BadDataError } from "../error";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { assert } from "superstruct";
import { UserCreationData, UserConnectData } from "../validation/user";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextFunction } from "express";
import { expressjwt, Request as AuthRequest } from "express-jwt";

const saltRounds = 12;

export const signup = async (req: Request, res: Response) => {
  assert(req.body, UserCreationData);
  try {
    const user = await prisma.user.create({
      data: {
        fullName: req.body.fullName,
        email: req.body.email,
        passwordHash: await hash(req.body.password, saltRounds),
      },
      omit: { passwordHash: true },
    });
    res.json(user);
    res.status(201);
  } catch (err) {
    console.log(err);
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      throw new BadDataError(`${err.meta?.target} not unique`);
    }
    throw err;
  }
};

export const signin = async (req: Request, res: Response) => {
  assert(req.body, UserConnectData);
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (user && (await compare(req.body.password, user.passwordHash))) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const jwt = sign(user.id.toString(), process.env.JWT_SECRET);
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, jwt });
    // console.log("JWT:", jwt);
    res.status(201);
  } else {
    throw new NotFoundError("Invalid username or password");
  }
};

export const getConnectedUser = async (req: AuthRequest, res: Response) => {
  if (req.auth) {
    const { passwordHash, ...userWithoutPassword } = req.auth;
    res.json(userWithoutPassword);
    res.status(200);
  } else {
    throw new NotFoundError("User not found");
  }
};

export const auth_client = [
  expressjwt({
    secret: process.env.JWT_SECRET as string,
    algorithms: ["HS256"],
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.auth) },
    });
    if (user) {
      req.auth = user;
      next();
    } else {
      res.status(401).send("Invalid token");
    }
  },
];
