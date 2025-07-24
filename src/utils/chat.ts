import type { AppSession } from "@mentra/sdk";
import OpenAI from "openai";

interface QuestionAnalysisResponse {
	original_text: string;
	has_question: boolean;
	question: string | null;
	answer: string | null;
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function cleanTranscription(
	session: AppSession,
	text: string,
): Promise<QuestionAnalysisResponse> {
	const trimmedText = text.trim();

	try {
		session.logger.info(
			`[Clairvoyant] Processing text for question detection: "${trimmedText}"`,
		);

		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"You are a JSON-output assistant. Read the user's input text, detect if it contains a question. If yes, answer the question in 15 words or fewer. If no, skip the answer field. Always return valid JSON with these fields: original_text (string), has_question (boolean), question (string or null), answer (string or null). Do not include any extra keys or prose. If the answer can be answered in one word, return the answer in just one word.",
				},
				{
					role: "user",
					content: trimmedText,
				},
			],
			response_format: { type: "json_object" },
		});

		const messageContent = response.choices[0]?.message?.content;
		if (!messageContent) {
			throw new Error("No response content from OpenAI");
		}

		const result = JSON.parse(messageContent) as QuestionAnalysisResponse;

		if (result.has_question) {
			session.logger.info(
				`[Clairvoyant] Question detected: "${result.question}" | Answer: "${result.answer}"`,
			);
		} else {
			session.logger.info(`[Clairvoyant] No question detected in text`);
		}

		// Ensure all required fields are present
		return {
			original_text: result.original_text || trimmedText,
			has_question: result.has_question || false,
			question: result.question || null,
			answer: result.answer || null,
		};
	} catch (error) {
		session.logger.error("[Clairvoyant] Error processing with OpenAI:", error);
		return {
			original_text: trimmedText,
			has_question: false,
			question: null,
			answer: null,
		};
	}
}
