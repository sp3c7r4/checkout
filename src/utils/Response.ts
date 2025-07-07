import Http from "./Http";


export default class Response {
  private timeStamp: String = new Date().toLocaleString()
  statusCode: number
  httpStatus: string
  message: string
  data: any

  constructor(statusCode: number, httpStatus: string, message: string, data: any) {
    this.timeStamp;
    this.statusCode = statusCode;
    this.httpStatus = httpStatus;
    this.message = message;
    this.data = data;
  }
}

export function BAD_REQUEST(message: string, data: any = {}) {
  return new Response(
    Http.BAD_REQUEST.code,
    Http.BAD_REQUEST.status,
    message,
    data
  );
}

export function INTERNAL_SERVER_ERROR(message: string, data: any = {}) {
  return new Response(
    Http.INTERNAL_SERVER_ERROR.code,
    Http.INTERNAL_SERVER_ERROR.status,
    message,
    data
  );
}

export function CREATED(message: string, data: any) {
  return new Response(
    Http.CREATED.code,
    Http.CREATED.status,
    message,
    data
  );
}

export function UNAUTHORIZED(message: string, data: any = {}) {
  return new Response(
    Http.UNAUTHORIZED.code,
    Http.UNAUTHORIZED.status,
    message,
    data
  );
}

export function OK(message: string, data: any) {
  return new Response(Http.OK.code, Http.OK.status, message, data);
}
