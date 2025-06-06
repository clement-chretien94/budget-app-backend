import express, { Request, Response, NextFunction } from "express";
import * as user from "./requestHandlers/user";
import * as budget from "./requestHandlers/budget";
import cors from "cors";
import { HttpError } from "./error";
import { StructError } from "superstruct";

const app = express();
const port = 3000;

// TODO: Change to allow only specific origins
app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  next();
});

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// User routes
app.post("/signup", user.signup);
app.post("/signin", user.signin);

app.get("/user", user.auth_client, user.getConnectedUser);

// Budget routes
app.route("/budgets").all(user.auth_client).post(budget.createBudget);

app.get("/budgets/current", user.auth_client, budget.getCurrentBudget);

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
