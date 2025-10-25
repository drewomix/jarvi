import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
        server: {
                PACKAGE_NAME: z.string(),
                PORT: z.coerce.number(),
                MENTRAOS_API_KEY: z.string(),
                OPENWEATHERMAP_API_KEY: z.string(),
                TAVILY_API_KEY: z.string(),
                GOOGLE_MAPS_API_KEY: z.string(),
                HONCHO_API_KEY: z.string(),
                LM_STUDIO_BASE_URL: z.string().default("http://127.0.0.7:1234/v1"),
                LM_STUDIO_API_KEY: z.string().default("lm-studio"),
        },
        runtimeEnv: process.env,
});
