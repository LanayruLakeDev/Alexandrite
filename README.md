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

### Magistral Model Analysis

**Response Structure**: Uses `reasoning_content` field exclusively for content delivery.

**Thinking Process Tags**:
- Initial reasoning appears untagged
- Content flows sequentially through reasoning field
- No explicit thinking/answer separation markers

**Content Flow Pattern**:
1. **Reasoning Phase**: Problem analysis and decision-making process
2. **Solution Phase**: Direct response content (when present)
3. **Completion**: Stream termination with finish_reason

**Field Behavior**:
- `reasoning_content`: Contains complete response including reasoning
- `content`: Rarely populated, when present contains summary/final answer
- `finish_reason`: Standard termination indicators

**Token Consumption**:
- Reasoning content: 1000-2500 tokens typical
- Standard content: 50-300 tokens (when present)
- Recommended limit: 1500+ tokens for complete responses

**Chunking Characteristics**:
- Average chunk size: 200-250 bytes
- Chunks frequently split JSON objects
- Buffer reconstruction required for complete parsing

**Streaming Behavior**:
- Immediate reasoning content delivery
- No explicit thinking/answer phase transitions
- Content appears as continuous reasoning stream

### Key Findings

1. **Response Field Variations**: Different models utilize different field names for content delivery
2. **Token Allocation**: Processing capacity varies significantly between model implementations (500-1500 tokens)
3. **Stream Structure**: Response chunking behavior differs across model types
4. **Content Parsing**: Field extraction requirements vary by model architecture
5. **Magistral Specifics**: Requires reasoning_content field monitoring and higher token limits

### Implementation Notes

- Field detection logic required for `content` vs `reasoning_content`
- Buffer management for incomplete JSON chunks
- Token limit adjustments based on model requirements
- Stream parsing for multi-part responses
- Magistral-specific: reasoning_content should be treated as primary content stream

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
