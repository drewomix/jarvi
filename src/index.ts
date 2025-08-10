import fs from "node:fs";

import { AppServer, type AppSession, StreamType, ViewType } from "@mentra/sdk";
import Groq from "groq-sdk";
import {
	concatInt16Arrays,
	deleteFileSafe,
	pcmInt16ToWavBuffer,
	writeTempWavFile,
} from "./utils/audio";
import { cleanTranscription } from "./utils/chat";

const groq = new Groq();

async function sendAudioToGroq(
	session: AppSession,
	audioBuffers: Int16Array[],
	sampleRate = 16000,
) {
	const fullBuffer = concatInt16Arrays(audioBuffers);
	const wavBuffer = pcmInt16ToWavBuffer(fullBuffer, sampleRate);
	session.logger.info(`[Clairvoyant] WAV Buffer Size: ${wavBuffer.length}`);

	const filePath = writeTempWavFile(wavBuffer);

	try {
		session.logger.info(`[Clairvoyant] Sending audio to Groq...`);
		const translation = await groq.audio.translations.create({
			file: fs.createReadStream(filePath),
			model: "whisper-large-v3",
		});
		session.logger.info(translation.text);
		const answer = await cleanTranscription(session, translation.text);
		return answer;
	} finally {
		deleteFileSafe(filePath, session.logger);
	}
}

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
		let isSpeaking = false;
		let audioBuffers: Int16Array[] = [];
		session.subscribe(StreamType.AUDIO_CHUNK);

		session.events.onVoiceActivity((data) => {
			const wasSpeaking = isSpeaking;
			isSpeaking = data.status === true || data.status === "true";
			session.logger.info(
				`[Clairvoyant] VAD: wasSpeaking=${wasSpeaking}, isSpeaking=${isSpeaking}`,
			);

			if (wasSpeaking && !isSpeaking && audioBuffers.length > 0) {
				(async () => {
					const answer = await sendAudioToGroq(session, audioBuffers, 16000);

					session.layouts.showDoubleTextWall(
						answer.question ? `Q: ${answer.question}` : "No question detected.",
						answer.answer ? `A: ${answer.answer}` : "I'm not sure what you said.",
						{ view: ViewType.MAIN, durationMs: 10000 },
					);
				})().catch(console.error);
				audioBuffers = [];
				session.logger.info(`[Clairvoyant] Processed and cleared Audio...`);
			}
		});

		session.events.onAudioChunk((data) => {
			if (isSpeaking) {
				audioBuffers.push(new Int16Array(data.arrayBuffer));
				session.logger.info(`[Clairvoyant] Pushed audio buffer. Total buffers: ${audioBuffers.length}`);
			}
		});

		this.addCleanupHandler(() => {
			audioBuffers = [];
			isSpeaking = false;
			session.logger.info(`[Clairvoyant] Cleared audio buffers on shutdown.`);
		});

		session.layouts.showDoubleTextWall('// Clairvoyant', 'I\'m ready when you are.', {durationMs: 1000 });
	}
}

const app = new ExampleMentraOSApp();
app.start().catch(console.error);
