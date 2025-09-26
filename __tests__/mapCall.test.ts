import { describe, expect, test } from "bun:test";
import { getPlaces } from "../src/utils/tools/mapsCall";

describe("Maps API Integration", () => {
	test("getPlaces should return barber shops near specified location.", async () => {
		const query = "What Thai spots offer Thai iced tea?";
		const places = await getPlaces(query, {
			latitude: 40.7507,
			longitude: -73.9819,
		});
		expect(Array.isArray(places)).toBe(true);
		expect(places.length).toBeGreaterThan(0);
	});
});
