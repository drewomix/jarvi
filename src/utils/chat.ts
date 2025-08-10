import type { AppSession } from "@mentra/sdk";
import OpenAI from "openai";

interface QuestionAnalysisResponse {
	original_text: string;
	has_question: boolean;
	question: string | null; // now a ≤10-word summary of the question
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
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are a JSON-output assistant. Read the user's input text and determine if it contains a question. Return ONLY valid JSON with EXACTLY these fields: original_text (string), has_question (boolean), question (string or null), answer (string or null). Rules: 1) original_text: echo the input text verbatim. 2) has_question: true if a question exists, else false. 3) question: if has_question is true, provide a concise, optionally personable summary of the user's question in 10 words or fewer; do not include prefixed phrases like 'You asked'; if no question, return null. 4) answer: if has_question is true, answer in 15 words or fewer; otherwise null. Do not include any extra keys, comments, or prose.",
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