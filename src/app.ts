import express, { Request, Response, NextFunction } from "express";
import * as user from "./requestHandlers/user";
import * as budget from "./requestHandlers/budget";
import * as category from "./requestHandlers/category";
import * as transaction from "./requestHandlers/transaction";
import cors from "cors";
import { HttpError } from "./error";
import {
  assert,
  object,
  optional,
  refine,
  string,
  StructError,
} from "superstruct";
import { isInt } from "validator";

const app = express();
const port = 3000;

// TODO: Change to allow only specific origins
app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  next();
});

const ReqParams = object({
  budget_id: optional(refine(string(), "int", (value) => isInt(value))),
});

const validateParams = (req: Request, res: Response, next: NextFunction) => {
  assert(req.params, ReqParams);
  next();
};

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// User routes
app.post("/signup", user.signup);
app.post("/signin", user.signin);

app.get("/user", user.auth_client, user.getConnectedUser);

// Budget routes
app
  .route("/budgets")
  .all(user.auth_client)
  .get(budget.getBudgetByDate)
  .post(budget.createBudget);
app.get("/budgets/current", user.auth_client, budget.getCurrentBudget);

// Category routes
app.route("/categories").all(user.auth_client).get(category.getCategories);

app
  .route("/budgets/:budget_id/categories")
  .all(user.auth_client)
  .all(validateParams)
  .get(category.getCategoriesByBudget)
  .post(category.createCategory);

// Transaction routes
app
  .route("/transactions")
  .all(user.auth_client)
  .get(transaction.getTransactions)
  .post(transaction.createTransaction);

app
  .route("/budgets/:budget_id/transactions")
  .all(user.auth_client)
  .all(validateParams)
  .get(transaction.getTransactionsByBudget);

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof StructError) {
    err.status = 400;
    err.message = `Bad value for field ${err.key}`;
  }
  res.status(err.status ?? 500).send(err.message);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
