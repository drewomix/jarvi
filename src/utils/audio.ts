import fs from "node:fs";
import path from "node:path";
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

export function pcmInt16ToWavBuffer(
	int16: Int16Array,
	sampleRate = 16000,
): Buffer {
	const wav = new WaveFile();
	wav.fromScratch(1, sampleRate, "16", int16);
	return Buffer.from(wav.toBuffer());
}

export function writeTempWavFile(buffer: Buffer): string {
	const filePath = path.join(process.cwd(), `audio_${Date.now()}.wav`);
	fs.writeFileSync(filePath, buffer);
	return filePath;
}

export function deleteFileSafe(
	filePath: string,
	logger?: { info: (message: string) => void; warn: (message: string) => void },
) {
	try {
		fs.unlinkSync(filePath);
		if (logger) logger.info(`[Clairvoyant] Deleted temp file: ${filePath}`);
	} catch (err) {
		if (logger) {
			logger.warn(`[Clairvoyant] Failed to delete temp file: ${filePath}`);
			logger.warn(err as string);
		}
	}
}
