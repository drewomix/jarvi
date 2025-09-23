import type { AppSession } from "@mentra/sdk";
import { type TranscriptionData, ViewType } from "@mentra/sdk";
import { b, Router } from "./baml_client";
import { startWebSearchFlow } from "./handlers/search";
import { startWeatherFlow } from "./handlers/weather";

export async function handleTranscription(
	data: TranscriptionData,
	session: AppSession,
) {
	session.logger.info(`[Clairvoyant] Transcription: ${data.text}`);
	const routing = await b.Route(data.text);
	if (!routing.routing) {
		session.logger.warn(`[Clairvoyant] No routing decision made. Resetting...`);
		return;
	}
	switch (routing.routing) {
		case Router.WEATHER:
			session.logger.info(`[Clairvoyant] Weather route: starting async flow`);
			void startWeatherFlow(session);
			return;

		case Router.WEB_SEARCH:
			session.logger.info(
				`[Clairvoyant] Web search route: starting async flow`,
			);
			void startWebSearchFlow(data.text, session);
			return;

		default: {
			session.logger.info(`[Clairvoyant] Routing: Answering the question`);
			const response = await b.AnswerQuestion(data.text);
			if (response.has_question) {
				session.layouts.showTextWall(
					`${response.has_question ? `// Clairvoyant\nQ: ${response.question}` : ""}${response.answer ? `\nA: ${response.answer}` : ""}`,
					{ view: ViewType.MAIN, durationMs: 10000 },
				);
			} else {
				session.layouts.showTextWall(``, {
					view: ViewType.MAIN,
					durationMs: 2000,
				});
			}
			return response;
		}
	}
}
