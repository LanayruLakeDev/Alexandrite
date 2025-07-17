# NVIDIA NIM Proxy for JanitorAI

A Cloudflare Worker proxy that allows users to connect JanitorAI to NVIDIA NIM API using their own API keys.

## Features

- ✅ **CORS Support**: Enables browser-based apps to connect to NVIDIA NIM
- ✅ **User API Keys**: Each user uses their own NVIDIA API key
- ✅ **Streaming Support**: Preserves real-time streaming responses
- ✅ **Error Handling**: Provides clear error messages
- ✅ **Secure**: No API keys stored on the server

## How Users Configure JanitorAI

### 1. API Key Field:
```
nvapi-your-actual-key-here
```

### 2. Completions URL Field:
```
https://nvidia-nim-proxy.your-username.workers.dev/v1/chat/completions
```

### 3. Model/AI Name Field:
```
meta/llama-3.1-nemotron-70b-instruct
```

## Available Models

- `meta/llama-3.1-nemotron-70b-instruct`
- `meta/llama-3.1-8b-instruct`
- `deepseek-ai/deepseek-r1-distill-llama-70b`
- `qwen/qwen2.5-72b-instruct`
- `nvidia/llama-3.1-nemotron-70b-instruct`

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Login to Cloudflare:
```bash
npx wrangler login
```

3. Deploy:
```bash
npm run deploy
```

## Development

Run locally:
```bash
npm run dev
```

## Security

- API keys are passed through from users, not stored
- CORS headers properly configured
- Input validation for API key format
- Error handling for network issues

## License

MIT
