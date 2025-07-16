# Alexandrite Proxy/Router

Proxy that allows any website to connect to NIM APIs using user API keys.

## Features

- ✅ **Universal Compatibility**: Works with all openai and other websites...
- ✅ **CORS Support**: Enables browser-based apps to connect to AI APIs
- ✅ **User API Keys**: Each user uses their own API key
- ✅ **Streaming Support**: Preserves real-time streaming responses
- ✅ **Error Handling**: Provides clear error messages
- ✅ **Secure**: No API keys stored on the server
- ✅ **Lightweight**: Minimal overhead, no logging



### 3. Model Name:
```
meta/llama-3.1-70b-instruct
```
or
```
qwen/qwq-32b
```

## Available Models

See [MODELS.md](MODELS.md) for the complete list of 145+ available models.

## 🧪 Testing Scripts

The `testing/` folder contains helpful analysis tools and test scripts:

### **Interactive Chat**
- `magistral-chat.js` - Interactive terminal chat with Magistral
- `magistral-chat-clean.js` - Clean version with fixed reasoning_content parsing

### **Analysis Tools**
- `analyze-magistral-json.js` - Analyze raw JSON structure from models
- `test-magistral-terminal.js` - Real-time streaming test with progress bars

### **Model Testing**
- `get-real-models.js` - Get the actual list of available models from API
- `test-models.js` - Test different model availability

## 🚀 Running Tests

```bash
# Make sure you're in the testing folder
cd testing

# Add your API key to any test script first
# Replace 'api-YOUR_API_KEY_HERE' with your actual key

# Run the interactive chat (most useful)
node magistral-chat.js

# Run JSON analysis
node analyze-magistral-json.js

# Run terminal streaming test
node test-magistral-terminal.js
```

## 🎯 Key Findings

From our testing, we discovered important insights about different AI models:

1. **Magistral uses `reasoning_content`** field instead of `content`
2. **Thinking process streams first**, then final answer
3. **Token limits must be higher** (1500+) for complete responses
4. **Websites fail because they only look for `content`** field

These insights helped create fixes for the "No response from bot" issue!

## ⚠️ Important Notes


- **Replace placeholder keys** before running tests
- 

## Deployment

1. Install:
```bash
npm install
```

2. Login:
```bash
npx wrangler login
```

3. Deploy:
```bash
npm run deploy
```

## Development

Run:
```bash
npm run dev
```

## Security

- API keys are passed through from users, not stored
- CORS headers properly configured
- Input validation for API key format
- Error handling for network issues

## License

Not MIT
