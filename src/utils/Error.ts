import Http from "./Http";

export default class CustomError extends Error {
  status: string;
  status_code: number;

  constructor(message: string, status_code: number, status: string) {
    super(message);
    this.status = status;
    this.status_code = status_code;
    this.name = this.constructor.name; //
  }
}

export function CE_BAD_REQUEST(message: string) {
  throw new CustomError(
    message,
    Http.BAD_REQUEST.code,
    Http.BAD_REQUEST.status
  );
}

export function CE_INTERNAL_SERVER(message: string) {
  throw new CustomError(
    message,
    Http.INTERNAL_SERVER_ERROR.code,
    Http.INTERNAL_SERVER_ERROR.status
  );
}
