import { describe, expect, test } from "bun:test";

describe("Local maps search", () => {
        test("returns nearby matches ranked by relevance", async () => {
                const { getPlaces } = await import("../src/utils/tools/mapsCall");
                const results = await getPlaces("Thai iced tea", {
                        latitude: 40.7507,
                        longitude: -73.9819,
                });

                expect(results).toHaveLength(3);
                expect(results[0]).toEqual({
                        id: "thai-spice",
                        name: "Thai Spice",
                        address: "123 Main St",
                        snippet: "Loved for creamy Thai iced tea and curries",
                });
                expect(results.map((place) => place.id)).toEqual([
                        "thai-spice",
                        "bangkok-bites",
                        "siam-express",
                ]);
        });

        test("filters out places with no textual match", async () => {
                const { getPlaces } = await import("../src/utils/tools/mapsCall");
                const results = await getPlaces("bookstore", {
                        latitude: 40.7507,
                        longitude: -73.9819,
                });

                expect(results).toHaveLength(1);
                expect(results[0]).toEqual({
                        id: "midtown-book-nook",
                        name: "Midtown Book Nook",
                        address: "77 Library Ln",
                        snippet: "Independent bookstore with reading lounge",
                });
        });
});
