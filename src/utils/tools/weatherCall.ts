import type { FormattedWeather, WeatherConditionLite } from "../baml_client/types";

const WEATHER_CONDITIONS = [
        { id: 800, main: "Clear", description: "clear sky", icon: "01d" },
        { id: 801, main: "Partly Cloudy", description: "scattered clouds", icon: "02d" },
        { id: 802, main: "Cloudy", description: "broken clouds", icon: "03d" },
        { id: 500, main: "Rain", description: "light rain", icon: "10d" },
        { id: 600, main: "Snow", description: "light snow", icon: "13d" },
] as const satisfies readonly WeatherConditionLite[];

function dayOfYear(date: Date): number {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = Number(date) - Number(start);
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
}

function getTimezoneLabel(longitude: number): string {
        const offsetHours = Math.round(longitude / 15);
        const sign = offsetHours >= 0 ? "+" : "-";
        const padded = Math.abs(offsetHours).toString().padStart(2, "0");
        return `UTC${sign}${padded}`;
}

function pickCondition(precipitationProbability: number, avgTemp: number): WeatherConditionLite {
        if (precipitationProbability > 0.6) {
                return WEATHER_CONDITIONS[3];
        }
        if (avgTemp < 34) {
                return WEATHER_CONDITIONS[4];
        }
        if (precipitationProbability > 0.35) {
                return WEATHER_CONDITIONS[3];
        }
        if (precipitationProbability > 0.15) {
                return WEATHER_CONDITIONS[1];
        }
        return avgTemp > 80 ? WEATHER_CONDITIONS[0] : WEATHER_CONDITIONS[2];
}

function clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
}

function computeDailySummary(dayTemp: number, precipitationProbability: number): string {
        if (precipitationProbability > 0.6) {
                return "Expect steady showers";
        }
        if (precipitationProbability > 0.35) {
                return "Spotty rain possible";
        }
        if (dayTemp > 85) {
                return "Hot with bright skies";
        }
        if (dayTemp < 40) {
                return "Chilly with overcast spells";
        }
        return "Mild with light clouds";
}

export async function getWeatherData(lat: number, lon: number): Promise<FormattedWeather> {
        const now = new Date();
        const baseDay = dayOfYear(now);
        const seasonalSwing = Math.sin(((baseDay % 365) / 365) * Math.PI * 2) * 18;
        const latitudeAdjustment = -(Math.abs(lat) / 90) * 20;
        const longitudeInfluence = Math.cos((lon / 180) * Math.PI) * 6;
        const baseTemp = 68 + seasonalSwing + latitudeAdjustment + longitudeInfluence;

        const humidity = clamp(45 + Math.abs(lat) % 35, 30, 90);
        const windSpeed = clamp(5 + (Math.abs(lon) % 11), 3, 18);
        const cloudCover = clamp(20 + (Math.abs(lat + lon) % 60), 0, 100);
        const precipitationProbability = clamp(
                Math.abs(Math.sin((lat + lon) * 0.1)) * 0.7,
                0,
                0.9,
        );

        const currentConditions = pickCondition(precipitationProbability, baseTemp);

        const dailyForecast = Array.from({ length: 5 }).map((_, idx) => {
                const dayOffset = idx + 1;
                const tempSwing = Math.sin(((baseDay + dayOffset) / 365) * Math.PI * 2) * 6;
                const daytime = baseTemp + tempSwing + dayOffset;
                const night = daytime - (8 + dayOffset * 0.5);
                const minTemp = Math.min(daytime, night) - 2;
                const maxTemp = Math.max(daytime, night) + 2;
                const pop = clamp(precipitationProbability + idx * 0.05, 0, 0.95);
                const condition = pickCondition(pop, (daytime + night) / 2);

                return {
                        date: new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString(),
                        summary: computeDailySummary(daytime, pop),
                        temperature: {
                                day: clamp(daytime, -30, 110),
                                min: clamp(minTemp, -40, 110),
                                max: clamp(maxTemp, -20, 120),
                                night: clamp(night, -40, 100),
                        },
                        conditions: condition,
                        precipitation_probability: Number(pop.toFixed(2)),
                        rain: pop > 0.4 ? Number((pop * 5).toFixed(1)) : 0,
                };
        });

        const alerts = precipitationProbability > 0.7
                ? [
                                {
                                        sender_name: "Local Forecast",
                                        event: "Heavy Rain Watch",
                                        start: Math.floor(now.getTime() / 1000),
                                        end: Math.floor(now.getTime() / 1000) + 6 * 3600,
                                        description: "Periods of heavy rain possible. Plan for slick conditions.",
                                        tags: ["rain", "advisory"],
                                },
                        ]
                : [];

        return {
                location: {
                        lat,
                        lon,
                        timezone: getTimezoneLabel(lon),
                },
                current: {
                        temperature: Number(baseTemp.toFixed(1)),
                        feels_like: Number((baseTemp - 2 + humidity / 50).toFixed(1)),
                        conditions: currentConditions,
                        humidity: Math.round(humidity),
                        pressure: Math.round(1000 + (Math.cos(lat) + 1) * 10),
                        wind_speed: Number(windSpeed.toFixed(1)),
                        wind_direction: Math.floor(((lon + 360) % 360)),
                        visibility: 16093, // roughly 10 miles
                        uv_index: Number(clamp(8 - Math.abs(lat) / 15, 0, 11).toFixed(1)),
                        clouds: Math.round(cloudCover),
                },
                daily_forecast: dailyForecast,
                alerts,
        };
}
