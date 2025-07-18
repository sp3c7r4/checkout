import { relations, sql } from "drizzle-orm";
import { pgTable, varchar, json, integer, bigint, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { ulid } from 'ulid';
import { CartProduct } from "../types/product";

interface Settings {
    name: string;
    description: string;
    state: boolean;
  }

export const orderStatusEnum = pgEnum('order_status', ['pending', 'approved', 'canceled']);

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
  image: varchar({ length: 255 })
});

export const payment = pgTable('payment', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  reference: varchar({ length: 255 }).unique().notNull(),
  paystack_transaction_id: varchar({ length: 255 }).unique(),
  amount: bigint({ mode: 'number' }),
  currency: varchar({ length: 10 }).$default(() => 'NGN'),
  status: varchar({ length: 50 }),
  gateway_response: text(),
  paid_at: timestamp(),
  created_at: timestamp().default(sql`now()`),
  customer_id: varchar({ length: 255 }),
  authorization: json().$type<{
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    channel: string;
    signature: string;
    reusable: boolean;
    country_code: string;
  }>(),
  channel: varchar({ length: 50 }),
  metadata: json(),
  user_id: bigint({mode: 'number'}).notNull().references(() => user.id, { onDelete: 'cascade' }),
  business_id: varchar({ length: 26 }).notNull().references(() => business.id, { onDelete: 'cascade' })
})

export const order = pgTable('order', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  products: json().$type<CartProduct[]>(),
  status: orderStatusEnum('status').notNull().$default(() => 'pending'),
  total_price: integer().notNull().$default(() => 0),
  business_id: varchar({ length: 26 }).notNull().references(() => business.id, { onDelete: 'cascade' }),
  user_id: bigint({mode: 'number'}).notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const address = pgTable('address', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  street: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 255 }).notNull(),
  country: varchar({ length: 255 }).notNull(),
  business_id: varchar({ length: 26 }).references(() => business.id, {onDelete: "cascade"}),
});

export const logs = pgTable('logs', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  type: varchar({ length: 255 }).notNull(),
  ip: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  timestamp: timestamp().notNull().default(sql`now()`),
  business_id: varchar({ length: 26 }).notNull().references(() => business.id, { onDelete: 'cascade' }),
});

export const product = pgTable('product', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  name: varchar({ length: 255 }).notNull(),
  image: varchar({ length: 255 }).notNull(),
  price: varchar({ length: 255 }).notNull(),
  //New fields
  category: varchar({ length: 255 }).notNull().$default(() => 'general'),
  barcode: varchar({ length: 255 }).notNull().$default(() => ''),
  brand: varchar({ length: 255 }),
  //End of New Fields
  kg: varchar({ length: 255 }).notNull(),
  quantity: integer().notNull().$default(() => 0),
  description: varchar({ length: 255 }).notNull().$default(() => ''),
  business_id: varchar({length: 26}).notNull().references(() => business.id, { onDelete: 'cascade' })
})

export const user = pgTable('user', {
  id: bigint({mode: 'number'}).primaryKey().notNull(),
  first_name: varchar('first_name', { length: 255 }),
  last_name: varchar('last_name', { length: 255 }),
  username: varchar('username', {length: 255}),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 255 }),
  current_business_id: varchar({length: 26}).notNull().references(() => business.id, { onDelete: 'cascade' }),
})

export const cart = pgTable('cart', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  products: json().$type<CartProduct[]>(),
  user_id: bigint({mode: 'number'}).notNull().references(() => user.id, { onDelete: 'cascade' }),
  business_id: varchar({length: 26}).notNull().references(() => business.id, { onDelete: 'cascade' }),
  total_price: integer().notNull().$default(() => 0),
  total_kg: integer().notNull().$default(() => 0),
})

export const spreadsheet = pgTable('spreadsheet', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  name: varchar({ length: 255 }).notNull(),
  spreadsheet_id: varchar({ length: 255 }).notNull(),
  url: varchar({ length: 255 }).notNull(),
  business_id: varchar({ length: 26 }).notNull().references(() => business.id, { onDelete: 'cascade' }),
});

export const checkoutStates = pgTable('checkout_states', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  name: varchar({ length: 255 }).notNull(),
  value: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
})

export const settings = pgTable('settings', {
  id: varchar("id", { length: 26 }).primaryKey().notNull().$defaultFn(() => ulid()),
  mass_view: json().$type<Settings>().notNull().$default(() => ({ name: "Sheet Mass View", description: "Allow's sheet to be public.", state: false })),
  notifications: json().$type<Settings>().notNull().$default(() => ({ name: "Enable Notifications", description: "Receive email and SMS alerts for orders and updates.", state: false })),
  weekly_reports: json().$type<Settings>().notNull().$default(() => ({ name: "Weekly Reports", description: "Receive weekly performance and sales reports automatically.", state: false })),
  business_id: varchar({ length: 26 }).notNull().references(() => business.id, { onDelete: 'cascade' }),
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
    fields: [business.id],
    references: [address.business_id]
  }),
  spreadsheet: one(spreadsheet, {
    fields: [business.id],
    references: [spreadsheet.business_id]
  }),
  settings: one(settings, {
    fields: [business.id],
    references: [settings.business_id]
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

export const addressRelations = relations(address, ({ one }) => ({
  business: one(business, {
    fields: [address.business_id],
    references: [business.id]
  })
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