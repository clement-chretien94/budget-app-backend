import { object, string, size, refine } from "superstruct";
import { isEmail } from "validator";

export const UserCreationData = object({
  username: size(string(), 1, 50),
  email: refine(string(), "int", (value) => isEmail(value)),
  password: size(string(), 8, 50),
});

export const UserConnectData = object({
  username: size(string(), 1, 50),
  password: size(string(), 8, 50),
});
