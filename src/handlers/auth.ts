import { Success, UserError, handler } from "./handler";
import { Users, db } from "../db";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { generateJWT } from "~/lib/auth";
import { z } from "zod/v4";

export const handleRegistrationAttempt = handler(
	z.object({
		nickname: z
			.string()
			.min(3, "Nickname must be at least 3 characters long")
			.max(20, "Nickname must be at most 20 characters long")
			.regex(/^[a-zA-Z0-9_ ]+$/, "Nickname can only contain letters, numbers, spaces and underscores"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
	}),
	async (data) => {
		const existingUser = await db.query.Users.findFirst({
			where: eq(Users.nickname, data.nickname),
		});

		if (existingUser) return UserError("User with this nickname already exists");

		const newUser = {
			nickname: data.nickname,
			passwordHash: await bcrypt.hash(data.password, 10),
			avatarUrl: null,
		};

		await db.insert(Users).values(newUser);

		return Success();
	}
);

export const handleLoginAttempt = handler(
	z.object({
		nickname: z.string().min(1, "Nickname is required"),
		password: z.string().min(1, "Password is required"),
	}),
	async ({ nickname, password }) => {
		const user = await db.query.Users.findFirst({
			where: eq(Users.nickname, nickname),
		});

		if (!user || !(await bcrypt.compare(password, user.passwordHash))) return UserError("Invalid nickname or password");

		return Success({
			id: user.id,
			nickname: user.nickname,
			avatarUrl: user.avatarUrl,
			token: await generateJWT(user.id),
		});
	}
);
