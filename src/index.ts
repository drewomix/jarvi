import { AppServer, type AppSession, ViewType } from "@mentra/sdk";
import { answerQuestion } from "./utils/chat";

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
	constructor() {
		super({
			packageName: PACKAGE_NAME,
			apiKey: MENTRAOS_API_KEY,
			port: PORT,
		});
	}

	protected async onSession(session: AppSession): Promise<void> {
        session.events.onTranscription(async (data) => {
            if (!data.isFinal) return;
            const result = await answerQuestion(session, data.text);
            session.layouts.showDoubleTextWall(
                result.has_question
                    ? `// Clairvoyant\nQ: ${result.question}`
                    : "No question detected.",
                result.answer ? ` \nA: ${result.answer}` : "I'm not sure what you said.",
                { view: ViewType.MAIN, durationMs: 15000 },
            );
        });
	}
}

const app = new Clairvoyant();
app.start().catch(console.error);
