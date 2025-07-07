import BaseRepository from "./BaseRepository";
import { user } from "../db/schema";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { db } from "../db";
import { eq } from "drizzle-orm";

class UserRepository extends BaseRepository {
  constructor() {
    super(user)
  }

  // async readOneById(id: string) {
  //   try {
  //     const findOne = await db.query.user.findFirst({
  //       where: (u, {eq}) => eq(u.id, Number(id))
  //     });
  //     console.log(findOne)
  //     return findOne;
  //   } catch (err) {
  //     throw new CE_INTERNAL_SERVER(err.message);
  //   }
  // }

  // async readOneById(user_id: string) {
  //   try {
  //     const findOne = await db.query.userBusiness.findMany({
  //       where: (u, {eq}) => eq(u.business_id, business_id),
  //       with: {
  //         user: {
  //           with: {
  //             cart: true
  //           }
  //         }
  //     }})
  //     return findOne
  //   } catch (err) {
  //     throw new CE_INTERNAL_SERVER(err.message);
  //   }
  // }

  async readAll(business_id: string) {
    try {
      const findOne = await db.query.userBusiness.findMany({
        where: (u, {eq}) => eq(u.business_id, business_id),
        with: {
          user: true
        }
      })
      return findOne
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  // async readAllBusinessByUserId(user_id: number) {
  //   try {
  //     const findOne = await db.query.user.findFirst({
  //       where: eq(user.id, user_id),
  //       with: {
  //         businesses: {
  //           with: {
  //             business: {
  //               with: {
  //                 address: true,
  //                 products: true
  //               }
  //             }
  //           }
  //         }
  //       }
  //     });
  //     return findOne
  //   } catch (err) {
  //     throw new CE_INTERNAL_SERVER(err.message);
  //   }
  // }
}

export default new UserRepository();