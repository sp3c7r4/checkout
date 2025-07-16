import env from "../config/env";
import axios from "axios";
import { CE_INTERNAL_SERVER } from "./Error";

class Paystack {
  private url: string;
  private key: string;

  constructor() {
    this.url = 'https://api.paystack.co';
    this.key = env.PAYSTACK_SECRET_KEY;
  }

  async initializePayment(amount: number, email: string, metadata?: any) {
    try {
      const { data } = await axios({
        method: 'POST',
        url: `${this.url}/transaction/initialize`,
        headers: {
          Authorization: `Bearer ${this.key}`,
          'Content-Type': 'application/json',
        },
        data: { email, amount, metadata },
      });
      return data;
    } catch(e) {
      console.error('Error initializing payment:', e);
      throw new CE_INTERNAL_SERVER('Payment initialization failed');
    }
  }
}

export default new Paystack()