// Learn more about clients at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> LMStudio {
  provider openai-generic
  options {
    base_url env.LM_STUDIO_BASE_URL
    api_key env.LM_STUDIO_API_KEY
    model "qwen/qwen3-4b-2507"
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/retry
retry_policy Constant {
  max_retries 3
  // Strategy is optional
  strategy {
    type constant_delay
    delay_ms 200
  }
}

retry_policy Exponential {
  max_retries 2
  // Strategy is optional
  strategy {
    type exponential_backoff
    delay_ms 300
    multiplier 1.5
    max_delay_ms 10000
  }
}
