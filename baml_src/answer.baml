class QuestionAnalysisResponse {
    original_text string @description("Echo of the user's input text verbatim")
    has_question bool @description("Whether the text contains a question")
    question string? @description("Concise summary of the user's question in 10 words or fewer")
    answer string[] @description("Direct answer in 20 words or fewer")
}


function AnswerQuestion(text: string) -> QuestionAnalysisResponse {
    client "LMStudio"
    prompt #"
        {{ _.role("system") }}
        You analyze a user's message to detect and answer questions.
        Instructions:
        - Set original_text to the user's input text verbatim.
        - Set has_question to true only if a question is present; otherwise false.
        - If has_question is true:
          - question: concise (≤10 words) summary without prefixed phrases like 'You asked'.
          - answer: direct answer in ≤50 words as an array of lines. Each item in the array cannot be more than 10 words.
        - If no question is present, set question and answer to null.
        - If the user is describing someone else's conversation, set has_question to false.

        {{ ctx.output_format }}

        {{ _.role("user") }} {{ text }}
    "#
}

test test_answer_question {
    functions [AnswerQuestion]
    args {
        text "What is the capital of France?"
    }
}
