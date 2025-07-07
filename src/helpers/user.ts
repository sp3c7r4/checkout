import { db } from "../db";
import UserRepository from "../repository/UserRepository";

export function getUserById(user_id: string) {
  console.log("UserId: ", user_id)
  const res = db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, Number(user_id)),
  })
  console.log("Output: ", res)
  return res;
}