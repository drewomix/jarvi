import { describe, expect, test } from "bun:test";

const samplePayload = {
	places: [
		{
			id: "place-1",
			displayName: {
				text: "Thai Spice",
				languageCode: "en",
			},
			shortFormattedAddress: "123 Main St",
			reviewSummary: {
				text: {
					text: "Loved for creamy Thai iced tea and curries",
				},
			},
		},
		{
			id: "place-2",
			displayName: {
				text: "Bangkok Bites",
			},
			shortFormattedAddress: "45 Elm Ave",
		},
	],
};

describe("Maps API Integration", () => {
	test("getPlaces formats Google Places results", async () => {
		// Initialize environment variables through env.ts
		process.env.GOOGLE_MAPS_API_KEY ??= "test-key";
		process.env.PACKAGE_NAME ??= "test-package";
		process.env.PORT ??= "3000";
		process.env.MENTRAOS_API_KEY ??= "test-mentra-key";
		process.env.OPENWEATHERMAP_API_KEY ??= "test-weather-key";
		process.env.TAVILY_API_KEY ??= "test-tavily-key";
		process.env.HONCHO_API_KEY ??= "test-honcho-key";
		process.env.LM_STUDIO_BASE_URL ??= "http://127.0.0.7:1234/v1";
		process.env.LM_STUDIO_API_KEY ??= "lm-studio";

		// Ensure env is initialized
		await import("../src/utils/core/env");

		const originalFetch = globalThis.fetch;
		globalThis.fetch = Object.assign(
			async () =>
				new Response(JSON.stringify(samplePayload), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			{ preconnect: () => Promise.resolve() },
		);

		try {
			const { getPlaces } = await import("../src/utils/tools/mapsCall");
			const places = await getPlaces("Thai iced tea", {
				latitude: 40.7507,
				longitude: -73.9819,
			});

			expect(places).toHaveLength(2);
			expect(places[0]).toEqual({
				id: "place-1",
				name: "Thai Spice",
				address: "123 Main St",
				snippet: "Loved for creamy Thai iced tea and curries",
			});
			expect(places[1]).toEqual({
				id: "place-2",
				name: "Bangkok Bites",
				address: "45 Elm Ave",
				snippet: undefined,
			});
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("getPlaces throws on failed HTTP response", async () => {
		// Initialize environment variables through env.ts
		process.env.GOOGLE_MAPS_API_KEY ??= "test-key";
		process.env.PACKAGE_NAME ??= "test-package";
		process.env.PORT ??= "3000";
		process.env.MENTRAOS_API_KEY ??= "test-mentra-key";
		process.env.OPENWEATHERMAP_API_KEY ??= "test-weather-key";
		process.env.TAVILY_API_KEY ??= "test-tavily-key";
		process.env.HONCHO_API_KEY ??= "test-honcho-key";
		process.env.LM_STUDIO_BASE_URL ??= "http://127.0.0.7:1234/v1";
		process.env.LM_STUDIO_API_KEY ??= "lm-studio";

		// Ensure env is initialized
		await import("../src/utils/core/env");
		const originalFetch = globalThis.fetch;
		globalThis.fetch = Object.assign(
			async () =>
				new Response("Boom", {
					status: 500,
					statusText: "Internal Server Error",
				}),
			{ preconnect: () => Promise.resolve() },
		);

		try {
			const { getPlaces } = await import("../src/utils/tools/mapsCall");
			expect(
				getPlaces("anything", { latitude: 0, longitude: 0 }),
			).rejects.toThrow(/HTTP 500/);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
