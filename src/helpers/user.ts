import { db } from "../db";

export function getUserById(user_id: string): any {
  const res = db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, Number(user_id)),
  });
  return res;
}
