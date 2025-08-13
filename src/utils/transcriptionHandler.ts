import type { AppSession } from "@mentra/sdk";
import { type TranscriptionData, ViewType } from "@mentra/sdk";
import { b, Router } from "./baml_client";
import { getWeatherData } from "./tools/weatherCall";

// Store weather run IDs to prevent race conditions
const weatherRunIds = new WeakMap<AppSession, number>();

export async function handleTranscription(data: TranscriptionData, session: AppSession) {
	session.logger.info(`[Clairvoyant] Transcription: ${data.text}`);
	const routing = await b.Route(data.text);
	if (!routing.routing) {
		session.logger.warn(`[Clairvoyant] No routing decision made, defaulting to LLM`);
		return "No routing decision";
	}
	switch (routing.routing) {
		case Router.WEATHER:
			session.logger.info(`[Clairvoyant] Weather route: starting async flow`);
			// Fire-and-forget: start weather flow without blocking
			void startWeatherFlow(session);
			return; // Return immediately (non-blocking)
			
		default: {
			session.logger.info(`[Clairvoyant] Routing: defaulting to LLM`);
			const response = await b.AnswerQuestion(data.text);
			if (response.has_question) {
				session.layouts.showTextWall(
					`${response.has_question ? `// Clairvoyant\nQ: ${response.question}` : ""}${response.answer ? `\nA: ${response.answer}` : ""}`,
					{ view: ViewType.MAIN, durationMs: 10000 },
				);
			} else {
				session.layouts.showTextWall(
					`// Clairvoyant\nA: Something went wrong.`,
					{ view: ViewType.MAIN, durationMs: 2000 },
				);
			}
			return response;
		}
	}
}

/**
 * Non-blocking weather flow with improved UX and race condition handling
 */
async function startWeatherFlow(session: AppSession) {
	// UI: immediate feedback while waiting for location
	session.layouts.showTextWall("// Clairvoyant\nW: Looking outside...", {
		view: ViewType.MAIN,
		durationMs: 2000,
	});

	// Race/duplicate guard: ensure older callbacks can't overwrite newer UI
	const runId = Date.now();
	weatherRunIds.set(session, runId);

	let locationReceived = false;
	
	// Single-shot location handler with automatic unsubscribe
	const unsubscribe = session.events.onLocation(async (location) => {
		// Check if this is still the latest weather request
		if (weatherRunIds.get(session) !== runId) {
			session.logger.info(`[Clairvoyant] Ignoring stale location callback (runId: ${runId})`);
			return;
		}

		// Prevent duplicate handling
		if (locationReceived) return;
		locationReceived = true;

		try {
			// Immediately unsubscribe to prevent memory leaks
			unsubscribe?.();
			
			session.logger.info(`[Clairvoyant] Location received: ${location.lat}, ${location.lng}`);
			
			// Update UI to show we're fetching weather
			session.layouts.showTextWall("// Clairvoyant\nW: Getting the weather...", {
				view: ViewType.MAIN,
				durationMs: 1500,
			});

			const response = await getWeatherData(location.lat, location.lng);
			if (!response) {
				throw new Error("No weather response");
			}

			// Check again if this is still the current weather flow
			if (weatherRunIds.get(session) !== runId) {
				session.logger.info(`[Clairvoyant] Weather response arrived for stale request, discarding`);
				return;
			}

			const weatherLines = await b.SummarizeWeatherFormatted(response);
			
			// Display weather information with pacing for better UX
			for (let i = 0; i < weatherLines.lines.length; i++) {
				const line = weatherLines.lines[i];
				
				// One more check before each UI update
				if (weatherRunIds.get(session) !== runId) return;
				
				session.logger.info(`[Clairvoyant] Weather: ${line}`);
				session.layouts.showTextWall(`// Clairvoyant\nW: ${line}`, {
					view: ViewType.MAIN,
					durationMs: 3000,
				});
				
				// Add pacing between lines (except for the last one)
				if (i < weatherLines.lines.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 3000));
				}
			}
		} catch (err) {
			session.logger.error(`[Clairvoyant] Weather flow error: ${String(err)}`);
			
			// Only show error if this is still the current flow
			if (weatherRunIds.get(session) === runId) {
				session.layouts.showTextWall("// Clairvoyant\nW: Couldn't figure out the weather.", {
					view: ViewType.MAIN,
					durationMs: 2000,
				});
			}
		}
	});

	// Trigger device to fetch location (if available)
	try {
		// Try to request location using the location manager
		session.location.getLatestLocation({ accuracy: "high" })
			.then((location) => {
				session.logger.info(`[Clairvoyant] Location: ${location.lat}, ${location.lng}`);
				// The onLocation handler above will catch this
				session.logger.info(`[Clairvoyant] Location request initiated`);
			})
			.catch(err => {
				session.logger.warn(`[Clairvoyant] Could not request location: ${String(err)}`);
			});
	} catch (err) {
		session.logger.warn(`[Clairvoyant] Location request not available: ${String(err)}`);
	}

	// Timeout fallback if no location arrives
	const TIMEOUT_MS = 6000;
	setTimeout(() => {
		// Check if this timeout is for the current weather request
		if (weatherRunIds.get(session) !== runId) return;
		
		if (!locationReceived) {
			session.logger.warn(`[Clairvoyant] Location timeout after ${TIMEOUT_MS}ms`);
			
			// Unsubscribe the handler if it's still active
			unsubscribe?.();
			
			// Show timeout message
			session.layouts.showTextWall("// Clairvoyant\nW: Still waiting on location…", {
				view: ViewType.MAIN,
				durationMs: 2000,
			});
			
			// After another delay, show final failure message
			setTimeout(() => {
				if (weatherRunIds.get(session) === runId && !locationReceived) {
					session.layouts.showTextWall("// Clairvoyant\nW: Could not get your location.", {
						view: ViewType.MAIN,
						durationMs: 2000,
					});
				}
			}, 2000);
		}
	}, TIMEOUT_MS);
}
