import EventEmitter from "events";
import Mailer from "../utils/Mailer";
const CheckoutEmitter = new EventEmitter();

CheckoutEmitter.on("sendLoginMail", async (data) => {
  try {
    await Mailer.successLoginEmail(data);
  } catch(e) {
    console.error("Error sending login email:", e);
  }
});

export default CheckoutEmitter;
