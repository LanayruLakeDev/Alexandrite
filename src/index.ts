/**
 * NVIDIA NIM Proxy with Enhanced Thinking Removal & Performance Optimization
 */
const MODEL_MAPPING = {
  'gpt-4o': 'deepseek-ai/deepseek-r1',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'meta/llama-3.1-8b-instruct',
  'claude-3': 'nvidia/llama-3.1-nemotron-70b-instruct',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
};

// Public API key for passphrase users
const PUBLIC_API_KEY = 'FILL_THIS_WITH_YOUR_PUBLIC_API_KEY';
const SECRET_PASSPHRASE = 'i-goon-on-my-private-server-r1-0528';

// Ultra-fast thinking state tracker
let globalThinkingEnded = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com';
    const url = new URL(request.url);
    
    // 1. PATH NORMALIZATION
    let cleanPath = url.pathname.replace(/\/{2,}/g, '/');
    if (cleanPath.includes('/chat/completions/chat/completions')) {
      cleanPath = cleanPath.replace('/chat/completions/chat/completions', '/chat/completions');
    }
    cleanPath = cleanPath.endsWith('/models') ? '/v1/models' : '/v1/chat/completions';

    const nvidiaUrl = new URL(NVIDIA_API_HOST + cleanPath + url.search);
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
    if (!authHeader) return errorResponse('API key is required', 401);
    
    let apiKey = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // SECRET PASSPHRASE CHECK
    let keySource = 'User-provided';
    if (apiKey === SECRET_PASSPHRASE) {
      apiKey = PUBLIC_API_KEY;
      keySource = 'Public (via passphrase)';
    }
    
    // Validate key format
    if (!apiKey.startsWith('nvapi-')) {
      return errorResponse('Invalid NVIDIA API key format', 401);
    }

    // 4. MODELS ENDPOINT HANDLING
    if (cleanPath === '/v1/models') {
      try {
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
      } catch (error) {
        console.error('Model fetch error:', error);
      }
      
      // Fallback model list
      return jsonResponse({
        object: "list",
        data: [
          { id: "deepseek-ai/deepseek-r1", object: "model" },
          { id: "deepseek-ai/deepseek-r1-0528", object: "model" },
          { id: "qwen/qwen2-7b-instruct", object: "model" },
          { id: "qwen/qwen2.5-7b-instruct", object: "model" },
          { id: "qwen/qwen3-235b-a22b", object: "model" },
          { id: "qwen/qwq-32b", object: "model" }
        ]
      });
    }

    // 5. MAIN REQUEST PROCESSING
    let requestBody = null;
    let modifiedModel = '';
    let isStreaming = false;
    
    try {
      if (request.body) {
        const bodyText = await request.text();
        requestBody = JSON.parse(bodyText);
        
        // Apply model mapping
        if (requestBody.model && MODEL_MAPPING[requestBody.model]) {
          modifiedModel = requestBody.model;
          requestBody.model = MODEL_MAPPING[requestBody.model];
        }
        
        // Check for streaming
        isStreaming = requestBody.stream === true;
        
        // Parameter normalization
        if (requestBody.max_completion_tokens) {
          requestBody.max_tokens = requestBody.max_completion_tokens;
          delete requestBody.max_completion_tokens;
        }
      }
    } catch (error) {
      return errorResponse('Invalid request body', 400);
    }

    // 6. FORWARD REQUEST TO NVIDIA
    try {
      const headers = new Headers(request.headers);
      // Remove special headers before forwarding
      headers.delete('X-Hide-Thinking');
      headers.set('Host', new URL(NVIDIA_API_HOST).host);
      headers.set('Authorization', `Bearer ${apiKey}`);
      
      const response = await fetch(nvidiaUrl.toString(), {
        method: request.method,
        headers: headers,
        body: requestBody ? JSON.stringify(requestBody) : request.body,
      });
      
      // 7. ENHANCED THINKING TOKEN REMOVAL
      if (hideThinking && response.status === 200) {
        // Handle streaming responses
        if (isStreaming) {
          return this.processStreamingResponse(response);
        } 
        // Handle non-streaming responses
        else {
          return this.processNonStreamResponse(response);
        }
      }
      
      // Return unmodified response
      return new Response(response.body, withCorsHeaders(response));
      
    } catch (error) {
      return errorResponse('Failed to connect to NVIDIA API', 500);
    }
  },

  // Process streaming response with ultra-fast thinking removal
  async processStreamingResponse(response: Response): Promise<Response> {
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
    
    const process = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer && thinkingEnded) {
              await writer.write(encoder.encode(buffer));
            }
            await writer.close();
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          let position;
          
          // Process complete SSE events
          while ((position = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.substring(0, position);
            buffer = buffer.substring(position + 2);
            
            // Process and clean event
            const cleanedEvent = this.processEvent(event, thinkingEnded);
            if (cleanedEvent !== null) {
              await writer.write(encoder.encode(cleanedEvent + '\n\n'));
              if (cleanedEvent.includes('</think>')) {
                thinkingEnded = true;
              }
            }
          }
        }
      } catch (e) {
        await writer.abort(e);
      }
    };
    
    process();
    
    return new Response(readable, withCorsHeaders(response));
  },

  // Process individual SSE event
  processEvent(eventStr: string, thinkingEnded: boolean): string | null {
    if (!eventStr.startsWith('data: ')) return eventStr;
    
    const dataContent = eventStr.substring(6).trim();
    if (dataContent === '[DONE]') return eventStr;
    
    try {
      const data = JSON.parse(dataContent);
      if (data.choices?.[0]?.delta?.content) {
        const content = data.choices[0].delta.content;
        
        // If thinking hasn't ended, check if this chunk ends it
        if (!thinkingEnded) {
          const thinkEnd = content.indexOf('</think>');
          if (thinkEnd !== -1) {
            // Show only content after </think>
            data.choices[0].delta.content = content.substring(thinkEnd + 8);
            return data.choices[0].delta.content ? `data: ${JSON.stringify(data)}` : null;
          }
          // Still thinking, don't show anything
          return null;
        }
        
        // Thinking ended, show all content
        data.choices[0].delta.content = content;
      }
      return `data: ${JSON.stringify(data)}`;
    } catch (e) {
      return eventStr;
    }
  },

  // Process non-streaming response
  async processNonStreamResponse(response: Response): Promise<Response> {
    try {
      const responseText = await response.text();
      const responseData = JSON.parse(responseText);
      
      if (responseData.choices?.[0]?.message?.content) {
        const content = responseData.choices[0].message.content;
        const thinkEnd = content.lastIndexOf('</think>');
        responseData.choices[0].message.content = thinkEnd !== -1 
          ? content.substring(thinkEnd + 8)
          : content;
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