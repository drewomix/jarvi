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
		process.env.GOOGLE_MAPS_API_KEY ??= "test-key";
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () =>
			new Response(JSON.stringify(samplePayload), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});

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
		process.env.GOOGLE_MAPS_API_KEY ??= "test-key";
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () =>
			new Response("Boom", {
				status: 500,
				statusText: "Internal Server Error",
			});

		try {
			const { getPlaces } = await import("../src/utils/tools/mapsCall");
			await expect(
				getPlaces("anything", { latitude: 0, longitude: 0 }),
			).rejects.toThrow(/HTTP 500/);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
