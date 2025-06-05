import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const Users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	nickname: varchar("nickname", { length: 31 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	avatarUrl: varchar("avatar_url", { length: 255 }),
});
