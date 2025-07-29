/**
 * NIM Proxy with Enhanced Thinking Removal & Performance Optimization
 */
const MODEL_MAPPING = {
  'gpt-4o': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'mistralai/mistral-nemotron',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
  'deepseek-prover': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
};

// Public API key for passphrase users
const PUBLIC_API_KEY = 'FILL_THIS_WITH_YOUR_PUBLIC_API_KEY';
const SECRET_PASSPHRASE = 'i-goon-on-my-private-server';

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
        
        // Set default max_tokens based on user intent
        if (!requestBody.max_tokens) {
          requestBody.max_tokens = 4096;
        } else if (requestBody.max_tokens === 0) {
          requestBody.max_tokens = 32768;
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

  // Process streaming response with simple thinking removal
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
    let sentThinkingMessage = false;
    
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

  // Process individual SSE event
  processEvent(eventStr: string, thinkingEnded: boolean): string | null {
    console.log(`[ThinkingStrip][EVENT] Processing event: "${eventStr}" (thinkingEnded: ${thinkingEnded})`);
    
    if (!eventStr.startsWith('data: ')) {
      console.log('[ThinkingStrip][EVENT] Not a data event, passing through');
      return eventStr;
    }
    
    const dataContent = eventStr.substring(6).trim();
    console.log(`[ThinkingStrip][EVENT] Data content: "${dataContent}"`);
    
    if (dataContent === '[DONE]') {
      console.log('[ThinkingStrip][EVENT] DONE event, passing through');
      return eventStr;
    }
    
    try {
      const data = JSON.parse(dataContent);
      console.log('[ThinkingStrip][EVENT] Parsed JSON:', JSON.stringify(data, null, 2));
      
      if (data.choices?.[0]?.delta?.content) {
        const content = data.choices[0].delta.content;
        console.log(`[ThinkingStrip][EVENT] Found delta content: "${content}"`);
        
        // If thinking hasn't ended, check if this chunk ends it
        if (!thinkingEnded) {
          console.log('[ThinkingStrip][EVENT] Thinking not ended, checking for </think>');
          const thinkEnd = content.indexOf('</think>');
          console.log(`[ThinkingStrip][EVENT] </think> position: ${thinkEnd}`);
          
          if (thinkEnd !== -1) {
            console.log(`[ThinkingStrip][EVENT] Found </think> at position ${thinkEnd}`);
            // Show only content after </think>
            const stripped = content.substring(thinkEnd + 8);
            console.log(`[ThinkingStrip][EVENT] Content after </think>: "${stripped}"`);
            data.choices[0].delta.content = stripped;
            const result = stripped ? `data: ${JSON.stringify(data)}` : null;
            console.log(`[ThinkingStrip][EVENT] Returning: ${result}`);
            return result;
          }
          // Still thinking, don't show anything
          console.log('[ThinkingStrip][EVENT] Still thinking, filtering out content');
          return null;
        }
        
        // Thinking ended, show all content
        console.log(`[ThinkingStrip][EVENT] Thinking ended, showing all content: "${content}"`);
        data.choices[0].delta.content = content;
      } else {
        console.log('[ThinkingStrip][EVENT] No delta content found');
      }
      
      const result = `data: ${JSON.stringify(data)}`;
      console.log(`[ThinkingStrip][EVENT] Final result: "${result}"`);
      return result;
    } catch (e) {
      console.log('[ThinkingStrip][EVENT] JSON parse error:', e);
      return eventStr;
    }
  },

  // Process non-streaming response
  async processNonStreamResponse(response: Response): Promise<Response> {
    console.log('[ThinkingStrip][NON-STREAM] Processing non-streaming response');
    try {
      const responseText = await response.text();
      console.log('[ThinkingStrip][NON-STREAM] Raw response text:', responseText);
      const responseData = JSON.parse(responseText);
      console.log('[ThinkingStrip][NON-STREAM] Parsed response data:', JSON.stringify(responseData, null, 2));
      
      if (responseData.choices?.[0]?.message?.content) {
        const content = responseData.choices[0].message.content;
        console.log(`[ThinkingStrip][NON-STREAM] Original content: "${content}"`);
        console.log(`[ThinkingStrip][NON-STREAM] Content length: ${content.length}`);
        
        // Check for thinking patterns
        const hasThinkStart = content.includes('<think>');
        const thinkEnd = content.lastIndexOf('</think>');
        console.log(`[ThinkingStrip][NON-STREAM] Has <think>: ${hasThinkStart}`);
        console.log(`[ThinkingStrip][NON-STREAM] </think> position: ${thinkEnd}`);
        
        let stripped;
        
        if (thinkEnd !== -1) {
          // Normal case: </think> found
          stripped = content.substring(thinkEnd + 8);
          console.log(`[ThinkingStrip][NON-STREAM] Normal case - content after </think>: "${stripped}"`);
        } else if (hasThinkStart) {
          // Edge case: <think> without </think> (incomplete)
          console.log('[ThinkingStrip][NON-STREAM] Edge case - incomplete thinking block detected');
          stripped = '// Thinking ended abruptly before response.';
        } else {
          // No thinking tokens at all
          console.log('[ThinkingStrip][NON-STREAM] No thinking tokens found');
          stripped = content;
        }
        
        console.log(`[ThinkingStrip][NON-STREAM] Final stripped content: "${stripped}"`);
        console.log(`[ThinkingStrip][NON-STREAM] Final stripped length: ${stripped.length}`);
        responseData.choices[0].message.content = stripped.trim();
      } else {
        console.log('[ThinkingStrip][NON-STREAM] No message content found in response');
      }
      
      console.log('[ThinkingStrip][NON-STREAM] Final response data:', JSON.stringify(responseData, null, 2));
      return jsonResponse(responseData);
    } catch (error) {
      console.log('[ThinkingStrip][NON-STREAM] Processing error:', error);
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