/**
 * NIM Proxy with Public API Key Fallback
 */
const MODEL_MAPPING = {
  'gpt-4o': 'deepseek-ai/deepseek-r1',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'meta/llama-3.1-8b-instruct',
  'claude-3': 'nvidia/llama-3.1-nemotron-70b-instruct',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
};

// Public API key for shared usage
const PUBLIC_API_KEY = '';

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

    // 3. API KEY HANDLING WITH PUBLIC FALLBACK
    let apiKey = PUBLIC_API_KEY; // Default to public key
    let keySource = "public"; // Track key source for logging
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      // Extract from Authorization header if provided
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
        keySource = "user-header";
      } else {
        apiKey = authHeader;
        keySource = "user-header";
      }
    }

    // Validate API key format
    if (!apiKey.startsWith('nvapi-')) {
      return errorResponse('Invalid NVIDIA API key format. Key should start with "nvapi-"', 401);
    }

    console.log(`🔑 Using ${keySource} API key: ${apiKey.substring(0, 10)}...`);

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
    
    try {
      if (request.body) {
        const bodyText = await request.text();
        requestBody = JSON.parse(bodyText);
        
        // Apply model mapping
        if (requestBody.model && MODEL_MAPPING[requestBody.model]) {
          modifiedModel = requestBody.model;
          requestBody.model = MODEL_MAPPING[requestBody.model];
        }
        
        // Parameter normalization
        if (requestBody.max_completion_tokens) {
          requestBody.max_tokens = requestBody.max_completion_tokens;
          delete requestBody.max_completion_tokens;
        }
      }
    } catch (error) {
      console.error('Request body parse error:', error);
    }

    // 6. FORWARD REQUEST TO NVIDIA
    try {
      const headers = new Headers(request.headers);
      headers.set('Host', new URL(NVIDIA_API_HOST).host);
      headers.set('Authorization', `Bearer ${apiKey}`);
      
      const response = await fetch(nvidiaUrl.toString(), {
        method: request.method,
        headers: headers,
        body: requestBody ? JSON.stringify(requestBody) : request.body,
      });
      
      // 7. THINKING TOKEN REMOVAL
      if (hideThinking && response.status === 200) {
        try {
          const responseText = await response.text();
          let responseData = JSON.parse(responseText);
          
          if (responseData.choices?.[0]?.message?.content) {
            let content = responseData.choices[0].message.content;
            
            // ULTIMATE THINKING REMOVAL
            content = content
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/<\/think>/gi, '')
              .replace(/<think>/gi, '')
              .replace(/^<\/think>\s*/i, '')
              .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '')
              .replace(/\[thinking\]|\[\/thinking\]/gi, '')
              .trim();
              
            responseData.choices[0].message.content = content;
          }
          
          return jsonResponse(responseData);
          
        } catch (parseError) {
          console.error('Thinking removal parse error:', parseError);
          return new Response(response.body, withCorsHeaders(response));
        }
      }
      
      // Return unmodified response
      return new Response(response.body, withCorsHeaders(response));
      
    } catch (error) {
      console.error('🚨 Proxy error:', error);
      return errorResponse('Failed to connect to NVIDIA API', 500);
    }
  },
};

// HELPER FUNCTIONS
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