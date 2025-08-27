# AI Proxy

A secure proxy service for AI API endpoints.

## Features

- ✅ **CORS Support**: Enables browser-based apps to connect to AI APIs
- ✅ **User API Keys**: Each user uses their key
- ✅ **Streaming Support**: Preserves real-time streaming responses
- ✅ **Error Handling**: Provides clear error messages
- ✅ **Secure**: No API keys stored on the server

## Users Configure

### 1. API Key Field:
```
your-actual-key-here
```

### 2. Completions URL Field:
```
your-proxy-endpoint/v1/chat/completions
```

### 3. Model Name:
```
your-preferred-model-name
```

## Available Models

Models are dynamically loaded from the upstream API endpoints.

## Deployment

1. Install dependencies:
```bash
npm install
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

