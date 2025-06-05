import { RequestHandler, Response } from "express";

import { z } from "zod/v4";

type SuccessResponse = {
	result: "success";
	data: any;
};

type UserErrorResponse = {
	result: "user-error";
	error: string;
};

type ServerErrorResponse = {
	result: "server-error";
	error: string;
};

type CustomResponseGenerator = {
	result: "custom";
	generator: (res: Response) => void;
};

export type APIResponse = SuccessResponse | UserErrorResponse | ServerErrorResponse | CustomResponseGenerator;

export const handler =
	<T extends z.Schema>(requestSchema: T, callback: (data: z.infer<T>) => Promise<APIResponse> | APIResponse): RequestHandler =>
	async (req, res) => {
		const parsed = requestSchema.safeParse(req.body);

		let result: APIResponse;

		if (!parsed.success) {
			result = UserError(parsed.error.issues[0].message);
		} else {
			try {
				result = await callback(parsed.data);
			} catch (error) {
				result = ServerError("An unexpected error occurred: \n" + (error instanceof Error ? error.message : String(error)));
			}
		}

		switch (result.result) {
			case "success":
				res.status(200).json(result);
				break;
			case "user-error":
				res.status(400).json(result);
				break;
			case "server-error":
				res.status(500).json(result);
				break;
			case "custom":
				result.generator(res);
				break;
			default:
				res.status(500).json(ServerError(`Unknown response type ${(result as any).result}`));
				break;
		}
	};

export const Success = (data?: any): SuccessResponse => ({
	result: "success",
	data,
});

export const UserError = (message?: string): UserErrorResponse => ({
	result: "user-error",
	error: message || "There was an error with your request.",
});

export const ServerError = (message?: string): ServerErrorResponse => ({
	result: "server-error",
	error: message || "There was an error processing your request.",
});

export const CustomResponse = (generator: (res: Response) => void): CustomResponseGenerator => ({
	result: "custom",
	generator,
});
