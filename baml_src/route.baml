enum Router {
    WEATHER @description("Current or upcoming weather questions for a specific place.")
    WEB_SEARCH @description("News, current events, facts that change over time such as political events, or topics not obviously location-based.")
    MAPS @description("Finding nearby businesses, restaurants, addresses, or directions.")
    KNOWLEDGE @description("General knowledge that does not fit into other categories.")
    MEMORY_RECALL @description("Questions about the user's memory and personal history, personal preferences, personal opinions, goals, information about the user, or anything that is not a fact.")
}

class RoutingBehavior {
    origin string @description("Echo of the user's input text verbatim.")
    routing Router
}

function Route(text: string) -> RoutingBehavior {
    client "LMStudio"
    prompt #"
        You are a routing assistant. Pick the best router for the user's request.
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

test test_knowledge {
    functions [Route]
    args {
        text "What is the capital of France?"
    }
    @@assert( {{ this.routing == "KNOWLEDGE"}})
}

test test_knowledge_2 {
    functions [Route]
    args {
        text "What is the purpose of mitochondria?"
    }
    @@assert( {{ this.routing == "KNOWLEDGE"}})
}

test test_memory {
    functions [Route]
    args {
        text "What is my name?"
    }
    @@assert( {{ this.routing == "MEMORY_RECALL"}})
}

test test_memory_2 {
    functions [Route]
    args {
        text "Koyal, what did I eat yesterday?"
    }
    @@assert( {{ this.routing == "MEMORY_RECALL"}})
}
