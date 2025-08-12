import { AppServer, type AppSession } from "@mentra/sdk";
import { RateLimiter } from "./utils/tools/rateLimiting";
import { getWeatherData } from "./utils/tools/weatherCall";
import { handleTranscription } from "./utils/transcriptionHandler";

const PACKAGE_NAME =
	process.env.PACKAGE_NAME ??
	(() => {
		throw new Error("PACKAGE_NAME is not set in .env file");
	})();
const MENTRAOS_API_KEY =
	process.env.MENTRAOS_API_KEY ??
	(() => {
		throw new Error("MENTRAOS_API_KEY is not set in .env file");
	})();
const PORT = parseInt(process.env.PORT || "3000");

class Clairvoyant extends AppServer {
	private questionRateLimiter: RateLimiter;

	constructor() {
		super({
			packageName: PACKAGE_NAME,
			apiKey: MENTRAOS_API_KEY,
			port: PORT,
		});

		this.questionRateLimiter = new RateLimiter(1000);
	}

	protected async onSession(session: AppSession): Promise<void> {


		session.events.onTranscription(async (data) => {
			if (!data.isFinal) return;
			if (this.questionRateLimiter.shouldSkip(session.logger, "Clairvoyant")) {
				return;
			}
			await handleTranscription(data, session);
		});
	}
}

const app = new Clairvoyant();
app.start().catch(console.error);
