import { relations } from "drizzle-orm";
import { boolean } from "drizzle-orm/gel-core";
import { pgTable, varchar, json, integer, bigint } from "drizzle-orm/pg-core";
import { ulid } from 'ulid';

export const admin = pgTable('admin', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  first_name: varchar({ length: 255 }).notNull(),
  last_name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).unique().notNull(),
  password: varchar({ length: 255 }).notNull(),
});

export const business = pgTable('business', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  admin_id: varchar({ length: 26 }).unique().notNull().references(() => admin.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  address_id: varchar({ length: 26 }).references(() => address.id, {onDelete: "cascade"}),
});

export const address = pgTable('address', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  street: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 255 }).notNull(),
  country: varchar({ length: 255 }).notNull(),
});

export const product = pgTable('product', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  name: varchar({ length: 255 }).notNull(),
  image: varchar({ length: 255 }).notNull(),
  price: varchar({ length: 255 }).notNull(),
  kg: varchar({ length: 255 }).notNull(),
  business_id: varchar({length: 26}).notNull().references(() => business.id, { onDelete: 'cascade' })
})

export const user = pgTable('user', {
  id: bigint({mode: 'number'}).primaryKey().notNull(),
  first_name: varchar('first_name', { length: 255 }),
  last_name: varchar('last_name', { length: 255 }),
  username: varchar('username', {length: 255}),
  current_business_id: varchar({length: 26}).notNull().references(() => business.id, { onDelete: 'cascade' }),
})

export const cart = pgTable('cart', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  products: json(),
  user_id: bigint({mode: 'number'}).notNull().references(() => user.id, { onDelete: 'cascade' }),
  business_id: varchar({length: 26}).notNull().references(() => business.id, { onDelete: 'cascade' }),
  total_price: integer().notNull().$default(() => 0),
  total_kg: integer().notNull().$default(() => 0),
})

export const userBusiness = pgTable('user_business', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  user_id: bigint({mode: 'number'}).notNull().references(() => user.id, {onDelete: "cascade"}),
  business_id: varchar({length: 26}).notNull().references(() => business.id, {onDelete: "cascade"}),
})

//? Relationships
export const userBusinessRelations = relations(userBusiness, ({ one, many }) => ({
  user: one(user, {
    fields: [userBusiness.user_id],
    references: [user.id]
  }),
  business: one(business, {
    fields: [userBusiness.business_id],
    references: [business.id]
  })
}))


export const adminRelations = relations(admin, ({ one }) => ({
  business: one(business, {
    fields: [admin.id],
    references: [business.admin_id]
  })
}))

export const userRelations = relations(user, ({ many }) => ({
  businesses: many(userBusiness),
  carts: many(cart)
}))


export const businessRelations = relations(business, ({ one, many }) => ({
  admin: one(admin, {
    fields: [business.admin_id],
    references: [admin.id]
  }),
  address: one(address, {
    fields: [business.address_id],
    references: [address.id]
  }),
  products: many(product),
  users: many(userBusiness),
  carts: many(cart)
}))

export const productRelations = relations(product, ({ one }) => ({
  business: one(business, {
    fields: [product.business_id],
    references: [business.id]
  })
}))

export const addressRelations = relations(address, ({ many }) => ({
  businesses: many(business)
}))

export const cartRelations = relations(cart, ({ one }) => ({
  user: one(user, {
    fields: [cart.user_id],
    references: [user.id]
  }),
  business: one(business, {
    fields: [cart.business_id],
    references: [business.id]
  })
}))


//? Existing tables