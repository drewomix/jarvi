class QuestionAnalysisResponse {
  original_text string @description("Echo of the user's input text verbatim")
  has_question bool @description("Whether the text contains a question")
  question string? @description("Concise summary of the user's question in 10 words or fewer")
  answer string? @description("Direct answer in 20 words or fewer")
}

function AnswerQuestion(text: string) -> QuestionAnalysisResponse {
  client "Groq"
  prompt #"
    You are an assistant that analyzes a user's message to determine if it contains a question.
    Instructions:
    - Set original_text to the user's input text verbatim.
    - Set has_question to true only if a question is present; otherwise false.
    - If has_question is true:
      - question: return a concise, optionally personable summary of the user's question in 10 words or fewer.
        Do not include prefixed phrases like 'You asked'.
      - answer: provide a direct answer in 20 words or fewer.
    - If no question is present, set question and answer to null.
    - If the user's message appears to be referring to them speaking to another person then set has_question to false.

    {{ _.role("user") }} {{ text }}

    {{ ctx.output_format }}
  "#
}

test test_answer_question {
  functions [AnswerQuestion]
  args {
    text "What is the capital of France?"
  }
}
