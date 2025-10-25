import { randomUUID } from "node:crypto";

export interface MemoryMessage {
        peer_id: string;
        content: string;
        metadata?: Record<string, unknown>;
}

export interface MemorySession {
        addMessages(messages: MemoryMessage[]): Promise<void>;
        readonly id: string;
        getMessages(): MemoryMessage[];
}

export interface MemoryPeer {
        readonly id: string;
        chat(query: string): Promise<string>;
}

class LocalMemorySession implements MemorySession {
        private readonly messages: MemoryMessage[] = [];
        readonly id: string;

        constructor() {
                this.id = randomUUID();
        }

        async addMessages(messages: MemoryMessage[]): Promise<void> {
                for (const message of messages) {
                        this.messages.push({ ...message, content: message.content.trim() });
                }
        }

        getMessages(): MemoryMessage[] {
                return [...this.messages];
        }
}

class LocalMemoryPeer implements MemoryPeer {
        readonly id: string;
        constructor(
                peerId: string,
                private readonly session: LocalMemorySession,
        ) {
                this.id = peerId;
        }

        async chat(query: string): Promise<string> {
                const normalizedQuery = query.toLowerCase().trim();
                if (!normalizedQuery) {
                        return "";
                }

                const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
                const messages = this.session.getMessages();
                const scoredMessages = messages
                        .map((message, index) => ({
                                message,
                                score: this.calculateScore(
                                        tokens,
                                        message.content.toLowerCase(),
                                        index,
                                        messages.length,
                                ),
                        }))
                        .filter((entry) => entry.score > 0);

                if (scoredMessages.length === 0) {
                        return "";
                }

                scoredMessages.sort((a, b) => b.score - a.score);

                const topMessages = scoredMessages.slice(0, 3).map((entry) => entry.message.content);
                return topMessages.join("\n");
        }

        private calculateScore(
                tokens: string[],
                content: string,
                index: number,
                totalMessages: number,
        ): number {
                let score = 0;
                for (const token of tokens) {
                        if (content.includes(token)) {
                                score += 2;
                        }
                }
                const recencyBoost = 1 / (1 + (totalMessages - index));
                return score + recencyBoost;
        }
}

export async function initializeMemory(): Promise<[MemorySession, MemoryPeer[]]> {
        const session = new LocalMemorySession();
        const diatribePeer = new LocalMemoryPeer("diatribe", session);
        return [session, [diatribePeer]];
}
