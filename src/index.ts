import fs from "node:fs";
import path from "node:path";

import { AppServer, type AppSession, StreamType } from "@mentra/sdk";
import Groq from "groq-sdk";
import { WaveFile } from "wavefile";

export function concatInt16Arrays(arrays: Int16Array[]): Int16Array {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Int16Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

const groq = new Groq();

function pcmInt16ToWavBuffer(int16: Int16Array, sampleRate = 16000): Buffer {
	const wav = new WaveFile();
	wav.fromScratch(1, sampleRate, "16", int16);
	return Buffer.from(wav.toBuffer());
}

async function sendAudioToGroq(
	session: AppSession,
	audioBuffers: Int16Array[],
	sampleRate = 16000,
) {
	const fullBuffer = concatInt16Arrays(audioBuffers);
	const wavBuffer = pcmInt16ToWavBuffer(fullBuffer, sampleRate);
	session.logger.info(`[Clairvoyant] WAV Buffer Size: ${wavBuffer.length}`);

	const filePath = path.join(process.cwd(), `audio_${Date.now()}.wav`);
	fs.writeFileSync(filePath, wavBuffer);

	try {
		const translation = await groq.audio.translations.create({
			file: fs.createReadStream(filePath),
			model: "whisper-large-v3",
		});
		session.logger.info(translation.text);
		return translation.text;
	} finally {
		try {
			fs.unlinkSync(filePath);
			session.logger.info(`[Clairvoyant] Deleted temp file: ${filePath}`);
		} catch (err) {
			session.logger.warn(
				`[Clairvoyant] Failed to delete temp file: ${filePath}`,
			);
			session.logger.warn(err);
		}
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
			session.layouts.showReferenceCard(
				`. // Clairvoyant`,
				`Recording...`,
			);
			session.logger.info(
				`[Clairvoyant] VAD: wasSpeaking=${wasSpeaking}, isSpeaking=${isSpeaking}`,
			);

			if (wasSpeaking && !isSpeaking && audioBuffers.length > 0) {
				(async () => {
					await sendAudioToGroq(session, audioBuffers, 16000);
				})().catch(console.error);
				audioBuffers = [];
				session.logger.info(
					`[Clairvoyant] Processed and cleared audio buffer after VAD stopped.`,
				);
				session.layouts.showReferenceCard(
					`. // Clairvoyant`,
					`Stopped recording.`,
				);
			}
		});

		session.events.onAudioChunk((data) => {
			if (isSpeaking) {
				audioBuffers.push(new Int16Array(data.arrayBuffer));
				session.logger.info(`[Clairvoyant] Recording...`);
				session.logger.info(
					`[Clairvoyant] AudioBuffer Size: ${audioBuffers.length}`,
				);
			}
		});
	}
}

const app = new ExampleMentraOSApp();
app.start().catch(console.error);
