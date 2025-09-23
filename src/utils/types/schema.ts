import { z } from "zod";

export const webSearchSchema = z.object({
	title: z.string(),
	content: z.string(),
});
