import { SignJWT, jwtVerify } from "jose";

import { env } from "~/env";

export const generateJWT = (userId: number) => new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1m").sign(env.SECRET_KEY);

export const verifyJWT = async (token: string) =>
	await jwtVerify(token, env.SECRET_KEY, {
		algorithms: ["HS256"],
	})
		.then((result) => result.payload.userId as number)
		.catch(() => null);
