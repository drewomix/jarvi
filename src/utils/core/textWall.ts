import { type AppSession, ViewType } from "@mentra/sdk";

/**
 * Shows a loading message on the text wall during an async operation,
 * then clears it when the operation completes or fails.
 */
export async function showTextWallDuringOperation<T>(
	session: AppSession,
	loadingText: string,
	asyncOperation: () => Promise<T>,
	options: {
		view?: ViewType;
		clearDurationMs?: number;
	} = {},
): Promise<T> {
	const { view = ViewType.MAIN, clearDurationMs = 500 } = options;

	// Show the loading message
	session.layouts.showTextWall(loadingText, {
		view,
		durationMs: 30000,
	});

	try {
		const result = await asyncOperation();

		session.layouts.showTextWall("", {
			view,
			durationMs: clearDurationMs,
		});

		return result;
	} catch (error) {
		session.layouts.showTextWall("", {
			view,
			durationMs: clearDurationMs,
		});
		throw error;
	}
}
