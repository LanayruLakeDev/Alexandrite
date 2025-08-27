# AI Models

This proxy service supports various AI models from multiple providers.

# AI Models

This proxy service supports various AI models from multiple providers.

Models are dynamically loaded from upstream API endpoints and may include:

- Large language models (LLMs)
- Code generation models
- Multimodal models
- Specialized AI models

For the complete list of available models, query the `/v1/models` endpoint after deployment.

## Model Categories

### General Purpose Models
- High-quality language models for various tasks
- Support for both streaming and non-streaming responses
- Various model sizes available

### Specialized Models
- Code generation and technical tasks
- Creative writing and content generation
- Reasoning and analysis models

### Multimodal Models
- Models supporting text, images, and other media
- Vision-language understanding
- Advanced multimodal capabilities

## Usage Notes

- Models are automatically selected based on your API key type
- Model mapping may be applied for compatibility
- Streaming responses are supported where available
- Some models support advanced features like thinking tokens

*For the most up-to-date list of available models, please query the API directly.*
- **Context Length**: Most models support 4K-32K tokens
- **Streaming**: All models support streaming responses
- **Rate Limits**: Depends on your NVIDIA API plan
- **Costs**: Vary by model size and usage



