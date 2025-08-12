import { describe, expect, it } from "bun:test";
import { getWeatherData } from "../src/utils/tools/weatherCall";

describe("getWeatherData", () => {
	it("should fetch weather data from OpenWeatherMap API and conform to schema", async () => {
		// Check if API key is available
		if (!process.env.OPENWEATHERMAP_API_KEY) {
			console.log("⚠️  Skipping test: OPENWEATHERMAP_API_KEY not set");
			return;
		}

		const result = await getWeatherData(40.7128, -74.006);

		// Log the complete result for debugging
		console.log("🌤️ Weather Data Result:");
		console.log(JSON.stringify(result, null, 2));

		// Verify the function returns the expected structure
		expect(result).toHaveProperty("location");
		expect(result).toHaveProperty("current");
		expect(result).toHaveProperty("daily_forecast");
		expect(result).toHaveProperty("alerts");

		// Verify location data structure
		expect(result.location).toHaveProperty("lat");
		expect(result.location).toHaveProperty("lon");
		expect(result.location).toHaveProperty("timezone");
		expect(typeof result.location.lat).toBe("number");
		expect(typeof result.location.lon).toBe("number");
		expect(typeof result.location.timezone).toBe("string");

		// Verify current weather data structure
		expect(result.current).toHaveProperty("temperature");
		expect(result.current).toHaveProperty("feels_like");
		expect(result.current).toHaveProperty("conditions");
		expect(result.current).toHaveProperty("humidity");
		expect(result.current).toHaveProperty("pressure");
		expect(result.current).toHaveProperty("wind_speed");
		expect(result.current).toHaveProperty("wind_direction");
		expect(result.current).toHaveProperty("visibility");
		expect(result.current).toHaveProperty("uv_index");
		expect(result.current).toHaveProperty("clouds");

		// Verify temperature data types and ranges
		expect(typeof result.current.temperature).toBe("number");
		expect(typeof result.current.feels_like).toBe("number");
		expect(result.current.temperature).toBeGreaterThan(-100); // Reasonable temperature range
		expect(result.current.temperature).toBeLessThan(150);
		expect(result.current.feels_like).toBeGreaterThan(-100);
		expect(result.current.feels_like).toBeLessThan(150);

		// Verify conditions structure
		expect(result.current.conditions).toHaveProperty("id");
		expect(result.current.conditions).toHaveProperty("main");
		expect(result.current.conditions).toHaveProperty("description");
		expect(result.current.conditions).toHaveProperty("icon");
		expect(typeof result.current.conditions.id).toBe("number");
		expect(typeof result.current.conditions.main).toBe("string");
		expect(typeof result.current.conditions.description).toBe("string");
		expect(typeof result.current.conditions.icon).toBe("string");

		// Verify other current weather properties
		expect(typeof result.current.humidity).toBe("number");
		expect(result.current.humidity).toBeGreaterThanOrEqual(0);
		expect(result.current.humidity).toBeLessThanOrEqual(100);
		expect(typeof result.current.pressure).toBe("number");
		expect(result.current.pressure).toBeGreaterThan(0);
		expect(typeof result.current.wind_speed).toBe("number");
		expect(result.current.wind_speed).toBeGreaterThanOrEqual(0);
		expect(typeof result.current.wind_direction).toBe("number");
		expect(result.current.wind_direction).toBeGreaterThanOrEqual(0);
		expect(result.current.wind_direction).toBeLessThanOrEqual(360);
		expect(typeof result.current.visibility).toBe("number");
		expect(result.current.visibility).toBeGreaterThan(0);
		expect(typeof result.current.uv_index).toBe("number");
		expect(result.current.uv_index).toBeGreaterThanOrEqual(0);
		expect(typeof result.current.clouds).toBe("number");
		expect(result.current.clouds).toBeGreaterThanOrEqual(0);
		expect(result.current.clouds).toBeLessThanOrEqual(100);

		// Verify daily forecast structure
		expect(Array.isArray(result.daily_forecast)).toBe(true);
		expect(result.daily_forecast.length).toBeGreaterThan(0);

		const firstDay = result.daily_forecast[0];
		expect(firstDay).toHaveProperty("date");
		expect(firstDay).toHaveProperty("summary");
		expect(firstDay).toHaveProperty("temperature");
		expect(firstDay).toHaveProperty("conditions");
		expect(firstDay).toHaveProperty("precipitation_probability");
		expect(firstDay).toHaveProperty("rain");

		// Verify daily forecast data types
		expect(typeof firstDay.date).toBe("string");
		expect(firstDay.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO string format
		expect(typeof firstDay.summary).toBe("string");
		expect(typeof firstDay.precipitation_probability).toBe("number");
		expect(firstDay.precipitation_probability).toBeGreaterThanOrEqual(0);
		expect(firstDay.precipitation_probability).toBeLessThanOrEqual(1);
		expect(typeof firstDay.rain).toBe("number");
		expect(firstDay.rain).toBeGreaterThanOrEqual(0);

		// Verify daily temperature structure
		expect(firstDay.temperature).toHaveProperty("day");
		expect(firstDay.temperature).toHaveProperty("min");
		expect(firstDay.temperature).toHaveProperty("max");
		expect(firstDay.temperature).toHaveProperty("night");
		expect(typeof firstDay.temperature.day).toBe("number");
		expect(typeof firstDay.temperature.min).toBe("number");
		expect(typeof firstDay.temperature.max).toBe("number");
		expect(typeof firstDay.temperature.night).toBe("number");

		// Verify daily conditions structure
		expect(firstDay.conditions).toHaveProperty("id");
		expect(firstDay.conditions).toHaveProperty("main");
		expect(firstDay.conditions).toHaveProperty("description");
		expect(firstDay.conditions).toHaveProperty("icon");

		// Verify alerts structure
		expect(Array.isArray(result.alerts)).toBe(true);
		if (result.alerts.length > 0) {
			const firstAlert = result.alerts[0];
			expect(firstAlert).toHaveProperty("sender_name");
			expect(firstAlert).toHaveProperty("event");
			expect(firstAlert).toHaveProperty("start");
			expect(firstAlert).toHaveProperty("end");
			expect(firstAlert).toHaveProperty("description");
			expect(firstAlert).toHaveProperty("tags");
			expect(typeof firstAlert.sender_name).toBe("string");
			expect(typeof firstAlert.event).toBe("string");
			expect(typeof firstAlert.start).toBe("number");
			expect(typeof firstAlert.end).toBe("number");
			expect(typeof firstAlert.description).toBe("string");
			expect(Array.isArray(firstAlert.tags)).toBe(true);
		}
	});
});
