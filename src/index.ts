import { AppServer, type AppSession, StreamType, ViewType } from "@mentra/sdk";

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

class ExampleMentraOSApp extends AppServer {
	constructor() {
		super({
			packageName: PACKAGE_NAME,
			apiKey: MENTRAOS_API_KEY,
			port: PORT,
		});
	}

	protected async onSession(session: AppSession): Promise<void> {
    session.layouts.showReferenceCard(
      `. // Clairvoyant`,
      `Booting up...`,
      {
        view: ViewType.MAIN,
        durationMs: 5000,
      },
    )
		// session.events.onTranscription((data) => {
		// 	if (data.isFinal) {
		// 		session.layouts.showReferenceCard(
		// 			`. // Clairvoyant`,
		//       `You said: ${data.text}`,
		// 			{
		// 				view: ViewType.MAIN,
		// 				durationMs: 5000,
		// 			},
		// 		);
		// 		session.logger.info(`[Clairvoyant] You said: ${data.text}`);
		// 	}
		// });
		session.subscribe(StreamType.VAD);
    session.events.onVoiceActivity((data) => {
      const isSpeaking = data.status === true || data.status === "true";
      if (isSpeaking) {
        session.layouts.showReferenceCard(
          `. // Clairvoyant`,
          `Something was said.`,
        )
      }
      else {
        session.layouts.showReferenceCard(
          `. // Clairvoyant`,
          `Nothing was said.`,
        )
      }
    })
	}
}

const app = new ExampleMentraOSApp();
app.start().catch(console.error);
