/**
 *NIM Proxy with Simplified Thinking Removal
 * Features preserved:
 * - Secret passphrase authentication
 * - Model mapping
 * - Path normalization
 * - Streaming/non-streaming processing
 * - Your API key and goon routing preserved
 */

const MODEL_MAPPING = {
  'gpt-4o': 'deepseek-ai/deepseek-r1',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'meta/llama-3.1-8b-instruct',
  'claude-3': 'nvidia/llama-3.1-nemotron-70b-instruct',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
};

// Your API key and goon routing preserved
const PUBLIC_API_KEY = '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';
const SECRET_PASSPHRASE = 'i-goon-on-my-private-server-r1-0528';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com ';
    const url = new URL(request.url);
    
    // Path normalization (preserved)
    let cleanPath = url.pathname.replace(/\/{2,}/g, '/');
    if (cleanPath.includes('/chat/completions/chat/completions')) {
      cleanPath = cleanPath.replace('/chat/completions/chat/completions', '/chat/completions');
    }
    cleanPath = cleanPath.endsWith('/models') ? '/v1/models' : '/v1/chat/completions';
    
    const nvidiaUrl = new URL(NVIDIA_API_HOST + cleanPath + url.search);
    const hideThinking = url.searchParams.get('hide_thinking') === 'true' || 
                        request.headers.get('X-Hide-Thinking') === 'true';

    // CORS preflight (preserved)
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

    // API key handling (preserved)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return errorResponse('API key is required', 401);
    
    let apiKey = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    // Secret passphrase check (preserved)
    if (apiKey === SECRET_PASSPHRASE) {
      apiKey = PUBLIC_API_KEY;
    }

    // Validate key format (preserved)
    if (!apiKey.startsWith('nvapi-')) {
      return errorResponse('Invalid NVIDIA API key format', 401);
    }

    // Models endpoint handling (preserved)
    if (cleanPath === '/v1/models') {
      try {
        const modelResponse = await fetch('https://integrate.api.nvidia.com/v1/models ', {
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

    // Request body processing (preserved)
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

    // Forward to NVIDIA API
    try {
      const headers = new Headers(request.headers);
      headers.delete('X-Hide-Thinking');
      headers.set('Host', new URL(NVIDIA_API_HOST).host);
      headers.set('Authorization', `Bearer ${apiKey}`);
      
      const response = await fetch(nvidiaUrl.toString(), {
        method: request.method,
        headers: headers,
        body: requestBody ? JSON.stringify(requestBody) : request.body,
      });

      // Simplified thinking removal
      if (hideThinking && response.status === 200) {
        if (isStreaming) {
          return this.processStreamingResponse(response);
        } else {
          return this.processNonStreamResponse(response);
        }
      }
      
      return new Response(response.body, withCorsHeaders(response));
    } catch (error) {
      return errorResponse('Failed to connect to NVIDIA API', 500);
    }
  },

  // Simplified streaming response handler
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
    let thinkingCompleted = false; // Key flag for thinking phase
    
    const process = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer && thinkingCompleted) {
              await writer.write(encoder.encode(buffer));
            }
            await writer.close();
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          if (!thinkingCompleted) {
            const thinkEndIndex = buffer.indexOf('</think>');
            if (thinkEndIndex !== -1) {
              // We found the end of thinking - start streaming from there
              thinkingCompleted = true;
              buffer = buffer.slice(thinkEndIndex + 8); // 8 is length of </think>
            } else {
              // No closing tag yet - clear buffer
              buffer = '';
              continue;
            }
          }
          
          if (buffer) {
            await writer.write(encoder.encode(buffer));
            buffer = '';
          }
        }
      } catch (e) {
        await writer.abort(e);
      }
    };
    
    process();
    return new Response(readable, withCorsHeaders(response));
  },

  // Simplified non-streaming response handler
  async processNonStreamResponse(response: Response): Promise<Response> {
    try {
      const responseText = await response.text();
      
      // Find first </think> and take everything after it
      const thinkEndIndex = responseText.indexOf('</think>');
      const cleanedContent = thinkEndIndex !== -1 
        ? responseText.slice(thinkEndIndex + 8)
        : responseText;
      
      try {
        // Handle JSON responses
        const responseData = JSON.parse(cleanedContent);
        
        // Handle standard chat completion format
        if (responseData.choices?.[0]?.message?.content) {
          const contentIndex = responseData.choices[0].message.content.indexOf('</think>');
          responseData.choices[0].message.content = contentIndex !== -1 
            ? responseData.choices[0].message.content.slice(contentIndex + 8)
            : responseData.choices[0].message.content;
        }
        
        return jsonResponse(responseData);
      } catch (e) {
        // Return raw text if not JSON
        return new Response(cleanedContent, withCorsHeaders(response));
      }
    } catch (error) {
      return new Response(response.body, withCorsHeaders(response));
    }
  }
};

// Helper functions (preserved)
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