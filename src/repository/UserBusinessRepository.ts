import BaseRepository from "./BaseRepository";
import { address, business, userBusiness } from "../db/schema";
import BusinessRepository from "./BusinessRepository";
import { db } from "../db";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import UserRepository from "./UserRepository";
import CartRepository from "./CartRepository";
import { MyContext } from "../utils/checkout-bot";

class UserBusinessRepository extends BaseRepository {
  constructor() {
    super(userBusiness);
  }

  // async readOneById(user_id: string, business_id: string): Promise<any> {
  //   try {
  //     const existingRelation = await db.query.userBusiness.findFirst({
  //       where: (ub, { eq, and }) =>
  //         and(eq(ub.user_id, Number(user_id)), eq(ub.business_id, business_id)),
  //     });
  //     return existingRelation;
  //   } catch (err) {
  //     throw new CE_INTERNAL_SERVER(err.message);
  //   }
  // }

  // async readAll(user_id: string): Promise<any[]> {
  //   try {
  //     const businesses = await db.query.userBusiness.findMany({
  //       where: (ub, { eq }) => eq(ub.user_id, parseInt(user_id)),
  //       with: {
  //         business: {
  //           with: {
  //             address: true,
  //           },
  //         },
  //       },
  //     });
  //     return businesses;
  //   } catch (err) {
  //     throw new CE_INTERNAL_SERVER(err.message);
  //   }
  // }

  async readUserByIdandBusinessId(
    user_id: string,
    business_id: string): Promise<any> {
    try {
      const userBusiness = await db.query.userBusiness.findFirst({
        where: (ub, { eq, and }) =>
          and(eq(ub.user_id, Number(user_id)), eq(ub.business_id, business_id)),
      });
      return userBusiness;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readUsersByBusinessId(business_id: string) {
    try {
      const users = await db.query.userBusiness.findMany({
        where: (ub, { eq }) => eq(ub.business_id, business_id),
        with: {
          user: true,
        },
      });
      return users;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async storeUserWithBusiness(
    user: Partial<{
      first_name: string;
      id: string;
      last_name: string;
      username: string;
    }>,
    business_id: string,
    ctx: MyContext,
    business_name?: string
  ) {
    let { first_name, last_name, username, id: user_id } = user;
    try {
      const find_user = await UserRepository.readOneById(user_id as any);
      if (!find_user) {
        ctx.reply(
          `It seems this is your first time using checkout. Please wait while we setup your account.`
          // { parse_mode: 'MarkdownV2' }
        );
        await UserRepository.create({
          first_name,
          last_name,
          username,
          id: user_id,
          current_business_id: business_id,
        });
      }

      const user_link_business = await this.readUserByIdandBusinessId(user_id as any, business_id);
      if (!user_link_business) {
        const { message_id } = await ctx.reply(`You are not linked to this business. We will link you now.`);
        await this.create({ user_id, business_id });
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          message_id,
          undefined,
          `You have been successfully linked to ${business_name || 'this business'}.`
        );
      }

      await UserRepository.updateModel(user_id as any, {
        current_business_id: business_id,
      });

      const check_cart = await CartRepository.readCartByUserAndBusiness(
        user_id as any,
        business_id
      );
      console.log(check_cart, business_id)
      if (!check_cart) {
        ctx.reply(
          `A new cart has been created for you.`
          // { parse_mode: 'MarkdownV2' }
        );
        await CartRepository.create({
          user_id,
          products: [],
          business_id,
          total_price: 0,
          total_kg: 0,
        });
      }
      return { success: true, user_id, business_id };
    } catch (e) {
      console.error(e);
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }
}

export default new UserBusinessRepository();
