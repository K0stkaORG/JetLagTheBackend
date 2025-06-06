import { customType, pgEnum } from "drizzle-orm/pg-core";

import { Polygon as PolygonType } from "~/types/";

export const Team = pgEnum("team", ["hiders", "seekers"]);

export const Polygon = (name: string) =>
	customType<{ data: PolygonType; driverData: string }>({
		dataType() {
			return "jsonb";
		},
		toDriver(value: PolygonType): string {
			return JSON.stringify(value);
		},
	})(name);
