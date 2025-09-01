import Exa, { type BaseSearchOptions } from "exa-js";

interface ExaSearchOptions {
	type?: "fast" | "neural" | "keyword";
	livecrawl?: "never" | "always" | "auto";
	userLocation?: string;
	startPublishedDate?: string;
	endPublishedDate?: string;
	numResults?: number;
	text?: boolean;
}

interface WebSearchResult {
	query: string;
	texts: string[];
}

// Shared configuration and error handling
const DEFAULT_OPTIONS: ExaSearchOptions = {
	type: "fast",
	livecrawl: "never",
	userLocation: "US",
	numResults: 1,
	text: true,
};

function validateApiKey(): string {
	const apiKey = process.env.EXAWEBSETS_API_KEY;
	if (!apiKey) {
		throw new Error("EXAWEBSETS_API_KEY environment variable is required");
	}
	return apiKey;
}

function handleSearchError(error: unknown): never {
	if (error instanceof Error) {
		throw new Error(`Web search failed: ${error.message}`);
	}
	throw new Error("Web search failed: Unknown error");
}

/**
 * Performs a web search using the Exa API and returns the text content from results
 * @param query - The search query string
 * @param options - Optional search parameters
 * @returns Promise<WebSearchResult> - Object containing the original query and text results
 */
export async function performWebSearch(
	query: string,
	options: ExaSearchOptions = {},
): Promise<WebSearchResult> {
	const apiKey = validateApiKey();
	const exa = new Exa(apiKey);
	const searchOptions = { ...DEFAULT_OPTIONS, ...options };

	try {
		const result = await exa.searchAndContents(
			query,
			searchOptions as BaseSearchOptions & { text: true },
		);

		// Extract all text results directly from the response
		const texts = result.results?.map((result) => result.text || "") || [];

		return {
			query,
			texts,
		};
	} catch (error) {
		handleSearchError(error);
	}
}
