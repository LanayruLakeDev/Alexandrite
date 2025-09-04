/**
 * NIM Proxy with Enhanced Thinking Removal & Performance Optimization
 */

// Cloudflare Workers environment interface
interface Env {
  // Add any environment variables you need here
}

const MODEL_MAPPING = {
  'gpt-4o': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'mistralai/mistral-nemotron',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
  'deepseek-prover': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
};

// Public API key for passphrase users
const PUBLIC_API_KEY = 'nvapi-X';
const SECRET_PASSPHRASE = 'i-goon-on-my-private-server';

// Ultra-fast thinking state tracker
let globalThinkingEnded = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com';
      const url = new URL(request.url);
      
      // 1. PATH NORMALIZATION
      let cleanPath = url.pathname.replace(/\/{2,}/g, '/');
      
      // Handle common path variations
      if (cleanPath.includes('/chat/completions/chat/completions')) {
        cleanPath = cleanPath.replace('/chat/completions/chat/completions', '/chat/completions');
      }
      
      // Normalize to standard OpenAI paths - FIXED LOGIC
      if (cleanPath.endsWith('/models') || cleanPath.includes('/models')) {
        cleanPath = '/v1/models';
      } else if (cleanPath.includes('/chat/completions') || cleanPath.includes('/completions')) {
        cleanPath = '/v1/chat/completions';
      } else if (cleanPath === '/' || cleanPath === '') {
        cleanPath = '/v1/chat/completions'; // Default to chat completions
      } else {
        // Any other path, assume it's a chat completion request
        cleanPath = '/v1/chat/completions';
      }

      const hideThinking = url.searchParams.get('hide_thinking') === 'true' || 
                          request.headers.get('X-Hide-Thinking') === 'true';

    // 2. CORS PREFLIGHT HANDLING
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 3. API KEY HANDLING WITH SECRET PASSPHRASE
    const authHeader = request.headers.get('Authorization');
    
    let apiKey = '';
    if (authHeader) {
      apiKey = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;
    }
    
    // SECRET PASSPHRASE CHECK
    let keySource = 'User-provided';
    if (apiKey === SECRET_PASSPHRASE) {
      apiKey = PUBLIC_API_KEY;
      keySource = 'Public (via passphrase)';
    }
    
    // VERCEL AI GATEWAY DETECTION & ROUTING
    const isNvidiaKey = apiKey?.startsWith('nvapi-');
    const isVercelKey = !isNvidiaKey && apiKey && apiKey.length > 0;  // All non-NVIDIA keys are Vercel
    let targetEndpoint = NVIDIA_API_HOST;
    let isVercelRequest = false;
    
    if (isVercelKey) {
      targetEndpoint = 'https://ai-gateway.vercel.sh';
      isVercelRequest = true;
      keySource = 'Vercel AI Gateway';
    }
    
    // Accept any API key format - no validation restrictions

    // 4. MODELS ENDPOINT HANDLING
    if (cleanPath === '/v1/models') {
      try {
        if (isVercelRequest) {
          // Forward to Vercel AI Gateway models endpoint
          const modelResponse = await fetch('https://ai-gateway.vercel.sh/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (modelResponse.ok) {
            return new Response(modelResponse.body, withCorsHeaders(modelResponse));
          }
        } else {
          // Forward to NVIDIA models endpoint
          const modelResponse = await fetch('https://integrate.api.nvidia.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          
          if (modelResponse.ok) {
            const modelData = await modelResponse.json();
            const filteredModels = modelData.data.filter((model: any) => 
              model.id.startsWith('deepseek-ai/') || model.id.startsWith('qwen/')
            );
            return jsonResponse({ object: modelData.object, data: filteredModels });
          }
        }
      } catch (error) {
        // Silent error handling
      }
      
      // Fallback model list
      return jsonResponse({
        object: "list",
        data: [
          { id: "deepseek-ai/deepseek-r1", object: "model" },
          { id: "qwen/qwen2.5-7b-instruct", object: "model" },
          { id: "qwen/qwen3-235b-a22b", object: "model" },
          { id: "qwen/qwq-32b", object: "model" }
        ]
      });
    }

    // 5. MAIN REQUEST PROCESSING
    let requestBody: any = null;
    let modifiedModel = '';
    let originalModel = '';
    let isStreaming = false;
    let isVercelModel = false;
    
    try {
      if (request.body) {
        const bodyText = await request.text();
        if (bodyText.trim()) {
          requestBody = JSON.parse(bodyText);
        }
        
        // Detect Vercel AI Gateway models
        if (requestBody?.model) {
          originalModel = requestBody.model;
          isVercelModel = requestBody.model.includes('/') || // Models with provider prefix like "deepseek/deepseek-v3"
                          requestBody.model.includes('anthropic') ||
                          requestBody.model.includes('openai') ||
                          requestBody.model.includes('vercel');
          
          // Force Chutes as ONLY provider for Vercel requests (cheapest!)
          if (isVercelRequest) {
            requestBody.providerOptions = {
              gateway: {
                only: ['chutes'],  // STRICT: Only use Chutes, fail if not available
              }
            };
          }
          
          // Apply NVIDIA model mapping only when using NVIDIA API keys
          if (!isVercelRequest && requestBody.model && MODEL_MAPPING[requestBody.model as keyof typeof MODEL_MAPPING]) {
            modifiedModel = requestBody.model;
            requestBody.model = MODEL_MAPPING[requestBody.model as keyof typeof MODEL_MAPPING];
          }
          
          // Add chat_template_kwargs for deepseek-reasoner to enable reasoning tokens
          if (originalModel === 'deepseek-reasoner') {
            requestBody.chat_template_kwargs = { thinking: true };
          }
        }
        
        // Check for streaming
        isStreaming = requestBody?.stream === true;
        
        // Parameter normalization
        if (requestBody?.max_completion_tokens) {
          requestBody.max_tokens = requestBody.max_completion_tokens;
          delete requestBody.max_completion_tokens;
        }
        
        // Handle context length parameters (different apps use different names)
        if (requestBody?.context_length) {
          // Context length is usually just informational, models handle it automatically
        }
        
        if (requestBody?.max_context_tokens) {
          // Context length parameter noted but not modified
        }
        
        // Set default max_tokens based on user intent
        if (!requestBody?.max_tokens) {
          requestBody.max_tokens = 4096;
        } else if (requestBody.max_tokens === 0) {
          requestBody.max_tokens = 32768;
        }
      }
    } catch (error) {
      return errorResponse('Invalid request body', 400);
    }

    // 6. FORWARD REQUEST TO TARGET API
    try {
      const headers = new Headers(request.headers);
      // Remove special headers before forwarding
      headers.delete('X-Hide-Thinking');
      
      // Set target-specific headers
      if (isVercelRequest) {
        headers.set('Host', 'ai-gateway.vercel.sh');
        headers.set('Authorization', `Bearer ${apiKey}`);
        // Provider routing is handled via providerOptions in request body
      } else {
        headers.set('Host', new URL(NVIDIA_API_HOST).host);
        headers.set('Authorization', `Bearer ${apiKey}`);
      }
      
      const targetUrl = isVercelRequest 
        ? `https://ai-gateway.vercel.sh${cleanPath}${url.search}`
        : `${NVIDIA_API_HOST}${cleanPath}${url.search}`;
      
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: requestBody ? JSON.stringify(requestBody) : null,
      });
      
      // 7. ENHANCED THINKING TOKEN REMOVAL
      if (hideThinking && response.status === 200) {
        // Handle streaming responses
        if (isStreaming) {
          return this.processStreamingResponse(response, originalModel);
        } 
        // Handle non-streaming responses
        else {
          return this.processNonStreamResponse(response, originalModel);
        }
      }
      
      // Return unmodified response
      return new Response(response.body, withCorsHeaders(response));
      
    } catch (error) {
      const errorMsg = isVercelRequest ? 'Failed to connect to Vercel AI Gateway' : 'Failed to connect to NVIDIA API';
      return errorResponse(errorMsg, 500);
    }
  } catch (globalError) {
    // Catch any other errors in the entire request
    return errorResponse('Internal server error', 500);
  }
},

  // Process streaming response with simple thinking removal
  async processStreamingResponse(response: Response, originalModel: string = ''): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    if (!response.body) {
      return new Response('Empty response body', { status: 500 });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let thinkingEnded = false;
    let sentThinkingMessage = false;
    const isDeepSeekReasoner = originalModel === 'deepseek-reasoner';
    
    const process = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.close();
            return;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete SSE events
          let position;
          while ((position = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.substring(0, position);
            buffer = buffer.substring(position + 2);
            
            // For deepseek-reasoner, handle reasoning_content field differently
            if (isDeepSeekReasoner) {
              const processedEvent = this.processDeepSeekReasoningEvent(event);
              if (processedEvent !== null) {
                await writer.write(encoder.encode(processedEvent + '\n\n'));
              }
              continue;
            }
            
            // Original thinking token handling for other models
            // Send "*Thinking...*" immediately when we see ANY content (before thinking starts)
            if (!sentThinkingMessage && event.includes('"content"') && !thinkingEnded) {
              sentThinkingMessage = true;
              const thinkingEvent = `data: {"id":"thinking","object":"chat.completion.chunk","created":${Math.floor(Date.now()/1000)},"model":"thinking","choices":[{"index":0,"delta":{"role":"assistant","content":"*Thinking...*"},"logprobs":null,"finish_reason":null}]}\n\n`;
              await writer.write(encoder.encode(thinkingEvent));
            }
            
            // Check if this event contains </think> - if so, thinking has ended
            if (!thinkingEnded && event.includes('</think>')) {
              thinkingEnded = true;
              // Extract content after </think> from this event and hide the </think> tag
              // Pass false to processEvent so it handles the transition correctly
              const cleanedEvent = this.processEvent(event, false);
              if (cleanedEvent !== null) {
                await writer.write(encoder.encode(cleanedEvent + '\n\n'));
              }
              continue;
            }
            
            // If thinking ended, pass through all events
            if (thinkingEnded) {
              await writer.write(encoder.encode(event + '\n\n'));
            }
            // If still thinking, ignore the event (don't send to user)
          }
        }
      } catch (e) {
        await writer.abort(e);
      }
    };
    
    process();
    return new Response(readable, withCorsHeaders(response));
  },

  // Process DeepSeek reasoning events - handle reasoning_content field
  processDeepSeekReasoningEvent(eventStr: string): string | null {
    if (!eventStr.startsWith('data: ')) {
      return eventStr;
    }
    
    const dataContent = eventStr.substring(6).trim();
    
    if (dataContent === '[DONE]') {
      return eventStr;
    }
    
    try {
      const data = JSON.parse(dataContent);
      
      // Handle reasoning content - show with [REASONING] prefix
      if (data.choices?.[0]?.delta?.reasoning_content) {
        const reasoningContent = data.choices[0].delta.reasoning_content;
        // Create a new event for reasoning content with visual indicator
        const reasoningData = {
          ...data,
          choices: [{
            ...data.choices[0],
            delta: {
              ...data.choices[0].delta,
              content: `[REASONING] ${reasoningContent}`,
              reasoning_content: undefined // Remove the original field
            }
          }]
        };
        return `data: ${JSON.stringify(reasoningData)}`;
      }
      
      // Handle regular content - pass through as is
      if (data.choices?.[0]?.delta?.content) {
        return eventStr;
      }
      
      // For other types of events (metadata, etc.), pass through
      return eventStr;
    } catch (e) {
      return eventStr;
    }
  },

  // Process individual SSE event
  processEvent(eventStr: string, thinkingEnded: boolean): string | null {
    if (!eventStr.startsWith('data: ')) {
      return eventStr;
    }
    
    const dataContent = eventStr.substring(6).trim();
    
    if (dataContent === '[DONE]') {
      return eventStr;
    }
    
    try {
      const data = JSON.parse(dataContent);
      
      if (data.choices?.[0]?.delta?.content) {
        const content = data.choices[0].delta.content;
        
        // If thinking hasn't ended, check if this chunk ends it
        if (!thinkingEnded) {
          const thinkEnd = content.indexOf('</think>');
          
          if (thinkEnd !== -1) {
            // Show only content after </think>
            const stripped = content.substring(thinkEnd + 8);
            data.choices[0].delta.content = stripped;
            const result = stripped ? `data: ${JSON.stringify(data)}` : null;
            return result;
          }
          // Still thinking, don't show anything
          return null;
        }
        
        // Thinking ended, show all content
        data.choices[0].delta.content = content;
      }
      
      const result = `data: ${JSON.stringify(data)}`;
      return result;
    } catch (e) {
      return eventStr;
    }
  },

  // Process non-streaming response
  async processNonStreamResponse(response: Response, originalModel: string = ''): Promise<Response> {
    try {
      const responseText = await response.text();
      const responseData = JSON.parse(responseText);
      const isDeepSeekReasoner = originalModel === 'deepseek-reasoner';
      
      if (responseData.choices?.[0]?.message) {
        const message = responseData.choices[0].message;
        
        // Handle DeepSeek reasoning content in non-streaming mode
        if (isDeepSeekReasoner && message.reasoning_content) {
          const reasoningContent = message.reasoning_content;
          const finalContent = message.content || '';
          
          // Combine reasoning and final content with visual separation
          const combinedContent = `[REASONING] ${reasoningContent}\n\n[FINAL ANSWER] ${finalContent}`;
          responseData.choices[0].message.content = combinedContent;
          
          // Remove the reasoning_content field from response
          delete responseData.choices[0].message.reasoning_content;
        }
        // Handle traditional thinking patterns for other models
        else if (message.content) {
          const content = message.content;
          
          // Check for thinking patterns
          const hasThinkStart = content.includes('<think>');
          const thinkEnd = content.lastIndexOf('</think>');
          
          let stripped;
          
          if (thinkEnd !== -1) {
            // Normal case: </think> found
            stripped = content.substring(thinkEnd + 8);
          } else if (hasThinkStart) {
            // Edge case: <think> without </think> (incomplete)
            stripped = '// Thinking ended abruptly before response.';
          } else {
            // No thinking tokens at all
            stripped = content;
          }
          
          responseData.choices[0].message.content = stripped.trim();
        }
      }
      
      return jsonResponse(responseData);
    } catch (error) {
      return new Response(response.body, withCorsHeaders(response));
    }
  }
};

// Helper functions
function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: { message, type: 'proxy_error' } }, status);
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer',
  };
}

function withCorsHeaders(response: Response): ResponseInit {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return {
    status: response.status,
    headers: headers,
  };
}

interface Env {}