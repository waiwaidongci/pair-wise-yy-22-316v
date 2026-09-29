import { ERROR_CODES } from "../constants/errorCodes";

// service 层抛出的业务异常，controller 各自包装，错误码集中在 constants/errorCodes。
export class BusinessError extends Error {
  status: number;
  code: keyof typeof ERROR_CODES;

  constructor(code: keyof typeof ERROR_CODES, message: string, status = 400) {
    super(message);
    this.name = "BusinessError";
    this.status = status;
    this.code = code;
  }
}
