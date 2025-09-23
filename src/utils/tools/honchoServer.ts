import { Honcho } from "@honcho-ai/sdk";
import { env } from "../core/env";

const _honchoClient = new Honcho({
	apiKey: env.HONCHO_API_KEY,
	environment: "production",
	workspaceId: "with-context",
});
