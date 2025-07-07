import { Context, Next } from 'hono'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from './Response';
import CustomError from './Error';

// For handlers that directly return responses
const tryCatch = (controller: (c: Context) => Promise<Response>) => 
  async (c: Context, _next: Next) => {
    try {
      return await controller(c);
    } catch (error: any) {
      console.log("I'm here", error)
      if(error instanceof CustomError) {
        console.log("HI - HELLO ",error)
        const { status, status_code, message } = error;
        console.log("MERA: ",status, status_code, message)
        switch (status) {
          case 'BAD_REQUEST':
            return c.json(BAD_REQUEST(error.message), status_code)
          case 'INTERNAL_SERVER_ERROR':
            return c.json(INTERNAL_SERVER_ERROR(error.message), status_code)  
          default:
            return c.json(INTERNAL_SERVER_ERROR(error.message), 500)
        }
      }
      console.error("Error occurred:", error);
      return c.json(BAD_REQUEST(error.message, error.message), 400);
    }
  };

export default tryCatch;