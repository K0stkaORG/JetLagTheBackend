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
			.min(3, "Přezdívka musí mít alespoň 3 znaky")
			.max(20, "Přezdívka může mít maximálně 20 znaků")
			.regex(/^[a-zA-Z0-9_ ]+$/, "Přezdívka může obsahovat pouze písmena, čísla, mezery a podtržítka"),
		password: z
			.string()
			.min(8, "Heslo musí mít alespoň 8 znaků")
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, "Heslo musí obsahovat alespoň jedno velké písmeno, jedno malé písmeno a jedno číslo"),
	}),
	async (data) => {
		const existingUser = await db.query.Users.findFirst({
			where: eq(Users.nickname, data.nickname),
		});

		if (existingUser) return UserError("Uživatel s touto přezdívkou již existuje");

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
		nickname: z.string(),
		password: z.string(),
	}),
	async ({ nickname, password }) => {
		const user = await db.query.Users.findFirst({
			where: eq(Users.nickname, nickname),
		});

		if (!user || !(await bcrypt.compare(password, user.passwordHash))) return UserError("Neplatná přezdívka nebo heslo");

		return Success({
			id: user.id,
			nickname: user.nickname,
			avatarUrl: user.avatarUrl,
			token: await generateJWT(user.id),
		});
	}
);
