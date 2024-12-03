import assert from "node:assert";
import AppError from "./appErrors";
import AppErrorCode from "../constans/appErrorCode";
import { HttpStatusCode } from "../constans/http";

/*  Assert a condition and throws an AppError if the condition is false   */

type appAssert = (
  condition: any,
  HttpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

const appAssert: appAssert = (
  condition,
  HttpStatusCode,
  message,
  appErrorCode
) => assert(condition, new AppError(HttpStatusCode, message, appErrorCode));

export default appAssert;
