import type { PlaceSuggestion as BamlPlaceSuggestion } from "../baml_client/types";

interface StaticPlace extends BamlPlaceSuggestion {
        latitude: number;
        longitude: number;
        categories: string[];
}

const STATIC_PLACES: StaticPlace[] = [
        {
                id: "thai-spice",
                name: "Thai Spice",
                address: "123 Main St",
                snippet: "Loved for creamy Thai iced tea and curries",
                latitude: 40.7512,
                longitude: -73.982,
                categories: ["thai", "restaurant", "spice"],
        },
        {
                id: "bangkok-bites",
                name: "Bangkok Bites",
                address: "45 Elm Ave",
                snippet: "Cozy spot with peanut noodles and tea lattes",
                latitude: 40.749,
                longitude: -73.98,
                categories: ["thai", "restaurant", "noodles"],
        },
        {
                id: "siam-express",
                name: "Siam Express",
                address: "98 Pine Rd",
                snippet: "Quick curries and takeout favorites",
                latitude: 40.7485,
                longitude: -73.99,
                categories: ["thai", "takeout", "express"],
        },
        {
                id: "green-garden-cafe",
                name: "Green Garden Cafe",
                address: "55 Park Ave",
                snippet: "Vegetarian bowls, salads, and matcha treats",
                latitude: 40.752,
                longitude: -73.977,
                categories: ["cafe", "vegetarian", "matcha"],
        },
        {
                id: "midtown-book-nook",
                name: "Midtown Book Nook",
                address: "77 Library Ln",
                snippet: "Independent bookstore with reading lounge",
                latitude: 40.754,
                longitude: -73.983,
                categories: ["bookstore", "reading", "independent"],
        },
];

function toRadians(value: number): number {
        return (value * Math.PI) / 180;
}

function haversineDistanceKm(
        latitudeA: number,
        longitudeA: number,
        latitudeB: number,
        longitudeB: number,
): number {
        const EARTH_RADIUS_KM = 6371;
        const dLat = toRadians(latitudeB - latitudeA);
        const dLon = toRadians(longitudeB - longitudeA);
        const lat1 = toRadians(latitudeA);
        const lat2 = toRadians(latitudeB);

        const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
}

function getTextScore(queryTokens: string[], place: StaticPlace): number {
        let score = 0;
        const searchable = [place.name, place.address, place.snippet ?? "", ...place.categories]
                .join(" ")
                .toLowerCase();

        for (const token of queryTokens) {
                if (token && searchable.includes(token)) {
                        score += 1;
                }
        }

        return score;
}

export async function getPlaces(
        query: string,
        location: { latitude: number; longitude: number },
): Promise<BamlPlaceSuggestion[]> {
        const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        const scored = STATIC_PLACES.map((place) => {
                const textScore = getTextScore(tokens, place);
                const distanceKm = haversineDistanceKm(
                        location.latitude,
                        location.longitude,
                        place.latitude,
                        place.longitude,
                );
                const distancePenalty = distanceKm / 2; // prefer closer spots without discarding far ones
                const score = textScore * 5 - distancePenalty;
                return { place, score, textScore, distanceKm };
        });

        const filtered = scored
                .filter((entry) => entry.textScore > 0)
                .sort((a, b) => {
                        if (b.score === a.score) {
                                return a.distanceKm - b.distanceKm;
                        }
                        return b.score - a.score;
                })
                .slice(0, 5)
                .map(({ place }) => ({
                        id: place.id,
                        name: place.name,
                        address: place.address,
                        snippet: place.snippet,
                }));

        return filtered;
}
