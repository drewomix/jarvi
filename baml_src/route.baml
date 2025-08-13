enum Router {
    WEATHER
    WEB_SEARCH
}

class RoutingBehavior {
    origin string @description("Echo of the user's input text verbatim.")
    routing Router
}

function Route(text: string) -> RoutingBehavior {
    client "Groq"
    prompt #"
        You are a routing assistant. You are given a user's message and you need to determine which router to use. If the user's message does not contain a question, return NONE.
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