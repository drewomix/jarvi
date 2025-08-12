import type { AppSession } from "@mentra/sdk";
import { type TranscriptionData, ViewType } from "@mentra/sdk";
import { b, Router } from "./baml_client";
import { getWeatherData } from "./tools/weatherCall";

export async function handleTranscription(data: TranscriptionData, session: AppSession) {
	session.logger.info(`[Clairvoyant] Transcription: ${data.text}`);
	const routing = await b.Route(data.text);
	if (!routing.routing) {
		session.logger.warn(`[Clairvoyant] No routing decision made, defaulting to LLM`);
		return "No routing decision";
	}
	switch (routing.routing) {
		case Router.WEATHER:
			session.logger.info(`[Clairvoyant] Pulling Location, using ${Router.WEATHER} routing`);
			session.events.onLocation(async (location) => {
				session.logger.info(`[Clairvoyant] Location: ${location.lat}, ${location.lng}`);
				session.layouts.showTextWall("// Clairvoyant\nW: Looking outside...", {
					view: ViewType.MAIN,
					durationMs: 2000,
				});
				session.logger.info(`[Clairvoyant] Getting the Weather...`);
				const response = await getWeatherData(location.lat, location.lng);
				if (response) {
					const weatherLines = await b.SummarizeWeatherFormatted(response);
					for (const line of weatherLines.lines) {
						session.logger.info(`[Clairvoyant] Weather: ${line}`);
						
						session.layouts.showTextWall(`// Clairvoyant\nW: ${line}`, {
							view: ViewType.MAIN,
							durationMs: 3000,
						});
						
						if (line !== weatherLines.lines[weatherLines.lines.length - 1]) {
							await new Promise(resolve => setTimeout(resolve, 3000));
						}
					}
					return weatherLines
				}
				else {
					session.layouts.showTextWall("// Clairvoyant\nW: Couldn't figure out the weather.", {
						view: ViewType.MAIN,
						durationMs: 1000,
					});
				}
			});
			return;
		default: {
			session.logger.info(`[Clairvoyant] Routing: defaulting to LLM`);
			const response = await b.AnswerQuestion(data.text);
			if (response.has_question) {
				session.layouts.showTextWall(
					`${response.has_question ? `// Clairvoyant\nQ: ${response.question}` : ""}${response.answer ? `\nA: ${response.answer}` : ""}`,
					{ view: ViewType.MAIN, durationMs: 10000 },
				);
			} else {
				session.layouts.showTextWall(
					`// Clairvoyant\nA: Something went wrong.`,
					{ view: ViewType.MAIN, durationMs: 2000 },
				);
			}
			return response;
		}
	}
}
