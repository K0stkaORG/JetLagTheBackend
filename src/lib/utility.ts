import { IdMap } from "~/types";

export const MapById = <T extends { id: number }>(items: T[]): IdMap<T> => {
	const map = new Map<T["id"], T>();

	for (const item of items) map.set(item.id, item);

	return map;
};
