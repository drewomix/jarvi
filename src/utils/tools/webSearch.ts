import type { z } from "zod";
import { webSearchSchema } from "../types/schema";

interface SearchDocument {
        title: string;
        content: string;
        tags: string[];
        updated: string;
}

const KNOWLEDGE_BASE: SearchDocument[] = [
        {
                title: "LM Studio releases offline voice pack",
                content:
                        "LM Studio has introduced an offline voice pack that enables high quality transcription without internet access.",
                tags: ["lm studio", "release", "voice"],
                updated: "2024-10-12",
        },
        {
                title: "MentraOS developer tips",
                content:
                        "MentraOS apps can use session.layouts.showTextWall to present short updates. Rate limit requests to keep the interface responsive.",
                tags: ["mentraos", "development"],
                updated: "2024-09-03",
        },
        {
                title: "Coffee spots in Midtown",
                content:
                        "Green Garden Cafe and Cafe Nimbus are popular Midtown hangouts offering matcha, espresso, and quick lunches.",
                tags: ["food", "coffee", "midtown"],
                updated: "2024-08-22",
        },
        {
                title: "Thai restaurants with standout iced tea",
                content:
                        "Thai Spice and Bangkok Bites both serve creamy Thai iced tea alongside curries and peanut noodles.",
                tags: ["thai", "restaurant"],
                updated: "2024-07-18",
        },
        {
                title: "Indoor activities for rainy days",
                content:
                        "Consider visiting the Midtown Book Nook for a reading session or the Local Makers Market for hands-on workshops.",
                tags: ["activities", "indoor"],
                updated: "2024-11-01",
        },
        {
                title: "Productivity shortcuts for remote teams",
                content:
                        "Set up shared dashboards, keep asynchronous standups brief, and rotate facilitation duties to maintain engagement.",
                tags: ["productivity", "remote work"],
                updated: "2024-06-30",
        },
];

function tokenize(text: string): string[] {
        return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function getRecencyBoost(updated: string): number {
        const daysSinceUpdate = (Date.now() - new Date(updated).getTime()) / (1000 * 60 * 60 * 24);
        if (Number.isNaN(daysSinceUpdate)) {
                return 0;
        }
        return Math.max(0, 1 - daysSinceUpdate / 365);
}

function scoreDocument(queryTokens: string[], document: SearchDocument): number {
        const titleTokens = tokenize(document.title);
        const contentTokens = tokenize(document.content);

        let score = 0;
        for (const token of queryTokens) {
                if (titleTokens.includes(token)) score += 3;
                if (contentTokens.includes(token)) score += 1.5;
                if (document.tags.some((tag) => tag.includes(token))) score += 2;
        }

        return score + getRecencyBoost(document.updated);
}

function formatContent(content: string, queryTokens: string[]): string {
        const sentences = content.split(/(?<=\.)\s+/);
        for (const sentence of sentences) {
                const normalized = sentence.toLowerCase();
                if (queryTokens.some((token) => normalized.includes(token))) {
                        return sentence.trim();
                }
        }
        return sentences[0]?.trim() ?? content;
}

export async function performWebSearch(
        query: string,
): Promise<z.infer<typeof webSearchSchema>[]> {
        const tokens = tokenize(query);
        if (tokens.length === 0) {
                return [];
        }

        const ranked = KNOWLEDGE_BASE.map((document) => ({
                document,
                score: scoreDocument(tokens, document),
        }))
                .filter((entry) => entry.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);

        return ranked.map(({ document }) =>
                webSearchSchema.parse({
                        title: document.title,
                        content: formatContent(document.content, tokens),
                }),
        );
}
