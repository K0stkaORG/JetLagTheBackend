import { Games, Polygon, Users } from "../schema";
import { boolean, integer, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";

import { Dataset } from "~/types";
import { relations } from "drizzle-orm";

export const Datasets = pgTable("datasets", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name", { length: 63 }).notNull(),
	description: varchar("description", { length: 1023 }).notNull().default(""),
	ownerId: integer("owner_id")
		.notNull()
		.references(() => Users.id),
	gameAreaPolygon: Polygon("game_area_polygon"),
	questions: jsonb("questions").notNull().default([]).$type<Dataset["questions"]>(),
	cards: jsonb("cards").notNull().default([]).$type<Dataset["cards"]>(),
	deprecated: boolean("deprecated").notNull().default(false),
});

export const DatasetRelations = relations(Datasets, ({ one, many }) => ({
	games: many(Games),
	owner: one(Users, {
		fields: [Datasets.ownerId],
		references: [Users.id],
	}),
}));
