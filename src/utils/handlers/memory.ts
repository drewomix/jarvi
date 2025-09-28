import type { Peer, Session } from "@honcho-ai/sdk";
import { type AppSession, ViewType } from "@mentra/sdk";
import { b } from "../baml_client";

const memoryRunCallIds = new WeakMap<AppSession, number>();

export async function MemoryCapture(
	textArtifact: string,
	session: AppSession,
	memorySession: Session,
	peers: Peer[],
) {
	const runId = Date.now();
	memoryRunCallIds.set(session, runId);

	session.logger.info(
		`[startMemoryCaptureFlow] Starting memory capture flow for text artifact: ${textArtifact}`,
	);

	try {
		const diatribePeer = peers.find((peer) => peer.id === "diatribe");
		if (diatribePeer) {
			await memorySession.addMessages([
				{
					peer_id: diatribePeer.id,
					content: textArtifact,
					metadata: {
						timestamp: new Date().toISOString(),
						source: "handleTranscription",
					},
				},
			]);
		}
	} catch (error) {
		session.logger.error(`[startMemoryFlow] Error storing memory: ${error}`);
		if (memoryRunCallIds.get(session) === runId) {
			session.layouts.showTextWall("// Clairvoyant\nM: Couldn't remember!", {
				view: ViewType.MAIN,
				durationMs: 2000,
			});
		}
	}
}

export async function MemoryRecall(
	textQuery: string,
	session: AppSession,
	peers: Peer[],
) {
	const runId = Date.now();
	memoryRunCallIds.set(session, runId);

	session.logger.info(`[startMemoryRecallFlow] Starting memory recall flow`);

	try {
		const diatribePeer = peers.find((peer) => peer.id === "diatribe");
		if (diatribePeer) {
			const response = await diatribePeer.chat(textQuery);
			if (response) {
				const answerLines = await b.MemoryQueryRecall(textQuery, response);
				const lines = answerLines.results;
				if (lines?.length) {
					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];
						session.logger.info(
							`[startMemoryRecallFlow] Memory recall line: ${line}`,
						);
						session.layouts.showTextWall(`// Clairvoyant\nM: ${line}`, {
							view: ViewType.MAIN,
							durationMs: 3000,
						});
					}
				} else {
					session.logger.error(
						`[startMemoryRecallFlow] No lines in answerLines`,
					);
				}
			}
		}
	} catch (error) {
		session.logger.error(
			`[startMemoryRecallFlow] Error recalling memory: ${error}`,
		);
		if (memoryRunCallIds.get(session) === runId) {
			session.layouts.showTextWall("// Clairvoyant\nM: Couldn't remember!", {
				view: ViewType.MAIN,
				durationMs: 2000,
			});
		}
	}
}
