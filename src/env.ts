import "dotenv/config";

import { z } from "zod";

export const env = z
	.object({
		DATABASE_URL: z.string().readonly(),
		SERVER_PORT: z.coerce.number().readonly(),
		WS_PORT: z.coerce.number().readonly(),
	})
	.parse(process.env);
