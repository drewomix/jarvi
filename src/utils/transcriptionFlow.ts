import type { AppSession, TranscriptionData } from "@mentra/sdk";
import { b, Router } from "./baml_client";
import { startKnowledgeFlow } from "./handlers/knowledge";
import { startMapsFlow } from "./handlers/maps";
import { MemoryCapture, MemoryRecall } from "./handlers/memory";
import { startWebSearchFlow } from "./handlers/search";
import { startWeatherFlow } from "./handlers/weather";
import type { MemoryPeer, MemorySession } from "./tools/memoryCall";

export async function handleTranscription(
        data: TranscriptionData,
        session: AppSession,
        memorySession: MemorySession,
        peers: MemoryPeer[],
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

		case Router.MAPS:
			session.logger.info(`[Clairvoyant] Maps route: starting async flow`);
			void startMapsFlow(data.text, session, memorySession, peers);
			return;

		case Router.WEB_SEARCH:
			session.logger.info(
				`[Clairvoyant] Web search route: starting async flow`,
			);
			void startWebSearchFlow(data.text, session, memorySession, peers);
			return;

		case Router.KNOWLEDGE:
			session.logger.info(`[Clairvoyant] Routing: Starting knowledge flow`);
			void startKnowledgeFlow(data.text, session, memorySession, peers);
			return;

		case Router.MEMORY_RECALL:
			session.logger.info(
				`[Clairvoyant] Memory Recall route: starting async flow`,
			);
			void MemoryRecall(data.text, session, memorySession, peers);
			return;

		default: {
			session.logger.info(
				`[Clairvoyant] Memory Insertion route: starting async flow`,
			);
			void MemoryCapture(data.text, session, memorySession, peers);
			return;
		}
	}
}
