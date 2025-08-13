/**
 * Non-blocking weather flow with improved UX and race condition handling
 */

import { type AppSession, ViewType } from "@mentra/sdk";
import { b } from "../baml_client";
import { getWeatherData } from "../tools/weatherCall";

// Store weather run IDs to prevent race conditions
const weatherRunIds = new WeakMap<AppSession, number>();

export async function startWeatherFlow(session: AppSession) {
	// UI: immediate feedback while waiting for location
	session.layouts.showTextWall("// Clairvoyant\nW: Looking outside...", {
		view: ViewType.MAIN,
		durationMs: 2000,
	});


	const runId = Date.now();
	weatherRunIds.set(session, runId);

	let locationReceived = false;


	const unsubscribe = session.events.onLocation(async (location) => {
		if (weatherRunIds.get(session) !== runId) {
			session.logger.info(
				`[Clairvoyant] Ignoring stale location callback (runId: ${runId})`,
			);
			return;
		}

		if (locationReceived) return;
		locationReceived = true;

		try {
			unsubscribe?.();

			session.logger.info(
				`[Clairvoyant] Location received: ${location.lat}, ${location.lng}`,
			);

			session.layouts.showTextWall(
				"// Clairvoyant\nW: Getting the weather...",
				{
					view: ViewType.MAIN,
					durationMs: 1500,
				},
			);

			const response = await getWeatherData(location.lat, location.lng);
			if (!response) {
				throw new Error("No weather response");
			}

			if (weatherRunIds.get(session) !== runId) {
				session.logger.info(
					`[Clairvoyant] Weather response arrived for stale request, discarding`,
				);
				return;
			}

			const weatherLines = await b.SummarizeWeatherFormatted(response);

			for (let i = 0; i < weatherLines.lines.length; i++) {
				const line = weatherLines.lines[i];

				if (weatherRunIds.get(session) !== runId) return;

				session.logger.info(`[Clairvoyant] Weather: ${line}`);
				session.layouts.showTextWall(`// Clairvoyant\nW: ${line}`, {
					view: ViewType.MAIN,
					durationMs: 3000,
				});

				if (i < weatherLines.lines.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 3000));
				}
			}
		} catch (err) {
			session.logger.error(`[Clairvoyant] Weather flow error: ${String(err)}`);

			if (weatherRunIds.get(session) === runId) {
				session.layouts.showTextWall(
					"// Clairvoyant\nW: Couldn't figure out the weather.",
					{
						view: ViewType.MAIN,
						durationMs: 2000,
					},
				);
			}
		}
	});

	try {
		session.location
			.getLatestLocation({ accuracy: "high" })
			.then((location) => {
				session.logger.info(
					`[Clairvoyant] Location: ${location.lat}, ${location.lng}`,
				);
				session.logger.info(`[Clairvoyant] Location request initiated`);
			})
			.catch((err) => {
				session.logger.warn(
					`[Clairvoyant] Could not request location: ${String(err)}`,
				);
			});
	} catch (err) {
		session.logger.warn(
			`[Clairvoyant] Location request not available: ${String(err)}`,
		);
	}

	const TIMEOUT_MS = 6000;
	setTimeout(() => {
		if (weatherRunIds.get(session) !== runId) return;

		if (!locationReceived) {
			session.logger.warn(
				`[Clairvoyant] Location timeout after ${TIMEOUT_MS}ms`,
			);

			unsubscribe?.();

			session.layouts.showTextWall(
				"// Clairvoyant\nW: Still waiting on location…",
				{
					view: ViewType.MAIN,
					durationMs: 2000,
				},
			);

			setTimeout(() => {
				if (weatherRunIds.get(session) === runId && !locationReceived) {
					session.layouts.showTextWall(
						"// Clairvoyant\nW: Could not get your location.",
						{
							view: ViewType.MAIN,
							durationMs: 2000,
						},
					);
				}
			}, 2000);
		}
	}, TIMEOUT_MS);
}
