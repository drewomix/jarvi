import { randomUUID } from "node:crypto";
import { Honcho, type Peer, type Session } from "@honcho-ai/sdk";
import { env } from "../core/env";

export async function initializeMemory(): Promise<[Session, Peer[]]> {
	const honchoClient = new Honcho({
		apiKey: env.HONCHO_API_KEY,
		environment: "production",
		workspaceId: "with-context",
	});
	const session = await honchoClient.session(randomUUID());
	const diatribePeer = await honchoClient.peer("diatribe", {
		metadata: {
			name: "Diatribe",
			description:
				"A peer that listens to the raw translations of the users' speech.",
		},
	});
	await session.addPeers([diatribePeer]);
	return [session, [diatribePeer]];
}
