# Alexandrite Router

API proxy implementation for OpenAI-compatible endpoints.

## Features

- CORS header management
- Request forwarding and response streaming
- Authentication header processing
- Error handling and status codes
- Multi-model support

## Compatibility

- OpenAI API format
- Streaming response protocols
- Bearer token authentication
- JSON payload processing

## Configuration

### API Key:
```
api-key-value
```

### Endpoint:
```
https://proxy-url.workers.dev/v1/chat/completions
```

### Model:
```
model-identifier
```

## Model Analysis

Analysis of response structures across different model implementations:

### Standard Response Format
```json
{
  "choices": [{
    "delta": {
      "content": "response_text"
    }
  }]
}
```

### Alternative Response Format
```json
{
  "choices": [{
    "delta": {
      "reasoning_content": "reasoning_text"
    }
  }]
}
```

### Key Findings

1. **Response Field Variations**: Different models utilize different field names for content delivery
2. **Token Allocation**: Processing capacity varies significantly between model implementations (500-1500 tokens)
3. **Stream Structure**: Response chunking behavior differs across model types
4. **Content Parsing**: Field extraction requirements vary by model architecture

### Implementation Notes

- Field detection logic required for `content` vs `reasoning_content`
- Buffer management for incomplete JSON chunks
- Token limit adjustments based on model requirements
- Stream parsing for multi-part responses

## Testing

Test scripts available in `/testing` directory:

- `analyze-magistral-json.js` - Response structure analysis
- `magistral-chat-clean.js` - Stream processing implementation
- `magistral-chat.js` - Interactive testing interface

## Deployment

```bash
npm install
npx wrangler login
npm run deploy
```

## Development

```bash
npm run dev
```
