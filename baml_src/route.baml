enum Router {
    WEATHER
    WEB_SEARCH
    LLM_CALL
}

class RoutingBehavior {
    origin string @description("Echo of the user's input text verbatim.")
    routing Router
}

function Route(text: string) -> RoutingBehavior {
    client "GroqHeavy"
    prompt #"
        You are a routing assistant. You are given a user's message and you need to determine which router to use. If a query feels ambiguous, return LLM_CALL.
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

test test_llm_call {
    functions [Route]
    args {
        text "Why is the UV index such an important metric to measure in NYC?"
    }
    @@assert( {{ this.routing == "LLM_CALL"}})
}