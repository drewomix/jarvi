import { describe, expect, it } from "bun:test";
import { performWebSearch } from "../src/utils/tools/webSearch";

describe("performWebSearch", () => {
	it("should perform web search and return query with text results", async () => {
		// Check if API key is available
		if (!process.env.EXAWEBSETS_API_KEY) {
			console.log("⚠️  Skipping test: EXAWEBSETS_API_KEY not set");
			return;
		}

		const query = "President of the United States as of August 14, 2025?";
		const result = await performWebSearch(query);

		// Log the complete result for debugging
		console.log("🔍 Web Search Result:");
		console.log(JSON.stringify(result, null, 2));

		// Verify the function returns the expected structure
		expect(result).toHaveProperty("query");
		expect(result).toHaveProperty("texts");

		// Verify query matches input
		expect(result.query).toBe(query);
		expect(typeof result.query).toBe("string");

		// Verify texts is an array
		expect(Array.isArray(result.texts)).toBe(true);
		expect(result.texts.length).toBeGreaterThan(0);

		// Verify each text result is a string
		result.texts.forEach((text, index) => {
			expect(typeof text).toBe("string");
			expect(text.length).toBeGreaterThan(0);
			console.log(` Text ${index + 1}:`, text.substring(0, 200) + "...");
		});
	});

	it("should handle multiple results when requested", async () => {
		if (!process.env.EXAWEBSETS_API_KEY) {
			console.log("⚠️  Skipping test: EXAWEBSETS_API_KEY not set");
			return;
		}

		const query = "latest technology news";
		const result = await performWebSearch(query, { numResults: 3 });

		console.log("🔍 Multi-Result Search:");
		console.log(JSON.stringify(result, null, 2));

		expect(result.query).toBe(query);
		expect(Array.isArray(result.texts)).toBe(true);
		expect(result.texts.length).toBeLessThanOrEqual(3);
		expect(result.texts.length).toBeGreaterThan(0);

		result.texts.forEach((text, index) => {
			expect(typeof text).toBe("string");
			console.log(` Result ${index + 1}:`, text.substring(0, 150) + "...");
		});
	});
});
