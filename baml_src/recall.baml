class MemoryRecall {
    query string
    results AnswerLines
}

function MemoryQueryRecall(query: string, context: string) -> MemoryRecall {
    client "GroqHeavy"
    prompt #"
        You are a memory recall assistant. You are given a query and a context. You need to recall the memory that is most relevant to the query. Provide an answer in the form of a statement that sounds like a human would say it to a friend. You can use contractions, New York slang and accents if you want to. The results should be broken up into lines of text that sound like a human would say them to a friend and no more than 10 words per line as per the output format and no more than 3 lines as per the output format.
        {{ ctx.output_format }}
        {{ _.role("user") }} {{ query }} {{ context }}
    "#
}

test test_memory_query_recall {
    functions [MemoryQueryRecall]
    args {
        query "What is my name?"
        context "My name is John Doe. I am a software engineer. I live in San Francisco. I like to code."
    }
    @@assert({{ this.results|length == 1 }})
}