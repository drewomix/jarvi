enum Router {
    WEATHER
    WEB_SEARCH
    MAPS
    LLM_CALL
}

class RoutingBehavior {
    origin string @description("Echo of the user's input text verbatim.")
    routing Router
}

function Route(text: string) -> RoutingBehavior {
    client "GroqHeavy"
    prompt #"
        You are a routing assistant. Pick the best router for the user's request.
        - WEATHER: current or upcoming weather questions for a specific place.
        - WEB_SEARCH: general knowledge, news, or research not obviously location-based.
        - MAPS: finding nearby businesses, restaurants, addresses, or directions.
        - LLM_CALL: everything else or ambiguous queries.
        {{ _.role("user") }} {{ text }}
        {{ ctx.output_format }}
    "#
}

test test_weather {
    functions [Route]
    args {
        text "What is the weather in San Francisco?"
    }
    @@assert( {{ this.routing == "WEATHER"}})
}

test test_web_search {
    functions [Route]
    args {
        text "Who is the current president of the United States?"
    }
    @@assert( {{ this.routing == "WEB_SEARCH"}})
}

test test_maps {
    functions [Route]
    args {
        text "Find me a ramen restaurant near Union Square."
    }
    @@assert( {{ this.routing == "MAPS"}})
}

test test_llm_call {
    functions [Route]
    args {
        text "Why is the UV index such an important metric to measure in NYC?"
    }
    @@assert( {{ this.routing == "LLM_CALL"}})
}
