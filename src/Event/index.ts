import EventEmitter from "events";
import Mailer from "../utils/Mailer";
const CheckoutEmitter = new EventEmitter();

CheckoutEmitter.on("sendLoginMail", async (data) => {
  await Mailer.successLoginEmail(data);
});

export default CheckoutEmitter;
