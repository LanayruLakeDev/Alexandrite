/**
 * NVIDIA NIM Proxy for JanitorAI & Chub AI
 * This proxy allows users to use their own NVIDIA API keys with AI chat apps
 * by handling CORS and authentication header formatting.
 * 
 * Features:
 * - Model name mapping (e.g., gpt-4o -> deepseek-ai/deepseek-r1)
 * - CORS support for browser apps
 * - User API key forwarding
 * - Enhanced CORS headers for Chub AI compatibility
 */

// Model mapping configuration - add more mappings as needed
const MODEL_MAPPING = {
  'gpt-4o': 'deepseek-ai/deepseek-r1',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'meta/llama-3.1-8b-instruct',
  'claude-3': 'nvidia/llama-3.1-nemotron-70b-instruct',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
  // Add more mappings here as needed
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // The target host for the NVIDIA API
    const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com';

    // Create a new URL object based on the incoming request
    const url = new URL(request.url);

    // Fix double endpoint issue - normalize the path
    let cleanPath = url.pathname;
    
    // Remove duplicate /chat/completions if it exists
    if (cleanPath.includes('/chat/completions/chat/completions')) {
      cleanPath = cleanPath.replace('/chat/completions/chat/completions', '/chat/completions');
      console.log(`🔧 Fixed duplicate path: ${url.pathname} -> ${cleanPath}`);
    }
    
    // Fix ALL double slashes and normalize paths
    cleanPath = cleanPath.replace(/\/+/g, '/'); // Replace multiple slashes with single slash
    
    // Ensure we have the correct endpoint
    if (cleanPath.endsWith('/models') || cleanPath.includes('/models')) {
      cleanPath = '/v1/models';
    } else if (cleanPath.endsWith('/chat/completions') || cleanPath.includes('/chat/completions')) {
      cleanPath = '/v1/chat/completions';
    } else {
      cleanPath = '/v1/chat/completions'; // Default to chat completions
    }
    
    console.log(`🔧 Path normalization: ${url.pathname} -> ${cleanPath}`);

    // Build the new URL for the NVIDIA API
    const nvidiaUrl = new URL(NVIDIA_API_HOST + cleanPath + url.search);

    // Check if user wants to hide thinking traces (via URL param or header)
    const hideThinking = url.searchParams.get('hide_thinking') === 'true' || 
                        request.headers.get('X-Hide-Thinking') === 'true';

    // --- Enhanced CORS Pre-flight Request Handling ---
    // Browsers send an OPTIONS request first to check if the actual request is safe
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer',
          'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
        },
      });
    }

    // --- Extract API Key from Request ---
    // Get the Authorization header from the incoming request
    const authHeader = request.headers.get('Authorization');
    
    // Check if API key is provided
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: {
          message: 'API key is required. Please provide your NVIDIA API key in the app.',
          type: 'authentication_error'
        }
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer',
        },
      });
    }

    // Extract the API key from the Authorization header
    // JanitorAI might send it as "Bearer nvapi-xxx" or just "nvapi-xxx"
    let apiKey = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7); // Remove "Bearer " prefix
    }

    // Validate that it looks like an NVIDIA API key
    if (!apiKey.startsWith('nvapi-')) {
      return new Response(JSON.stringify({
        error: {
          message: 'Invalid NVIDIA API key format. Key should start with "nvapi-"',
          type: 'authentication_error'
        }
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer',
        },
      });
    }

    // Handle /models endpoint specially - forward to NVIDIA and filter response
    if (cleanPath === '/v1/models') {
      try {
        // Forward request to NVIDIA to get their full models list
        const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Host': 'integrate.api.nvidia.com'
          }
        });

        if (!nvidiaResponse.ok) {
          throw new Error(`NVIDIA API error: ${nvidiaResponse.status}`);
        }

        const nvidiaData = await nvidiaResponse.json();
        
        // Filter to only keep DeepSeek and Qwen models
        const filteredModels = nvidiaData.data.filter((model: any) => 
          model.id.startsWith('deepseek-ai/') || 
          model.id.startsWith('qwen/')
        );

        const filteredResponse = {
          object: nvidiaData.object,
          data: filteredModels
        };
        
        console.log(`📋 Models endpoint: Filtered ${nvidiaData.data.length} models to ${filteredModels.length} (DeepSeek + Qwen only)`);
        
        return new Response(JSON.stringify(filteredResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent',
          },
        });
        
      } catch (error) {
        console.error('Error fetching models:', error);
        // Fallback to a basic response if NVIDIA API fails
        const fallbackModels = {
          object: "list",
          data: [
            { id: "deepseek-ai/deepseek-r1", object: "model", created: Date.now(), owned_by: "deepseek" },
            { id: "deepseek-ai/deepseek-r1-0528", object: "model", created: Date.now(), owned_by: "deepseek" },
            { id: "deepseek-ai/deepseek-r1-distill-llama-8b", object: "model", created: Date.now(), owned_by: "deepseek" },
            { id: "deepseek-ai/deepseek-r1-distill-qwen-14b", object: "model", created: Date.now(), owned_by: "deepseek" },
            { id: "deepseek-ai/deepseek-r1-distill-qwen-32b", object: "model", created: Date.now(), owned_by: "deepseek" },
            { id: "deepseek-ai/deepseek-r1-distill-qwen-7b", object: "model", created: Date.now(), owned_by: "deepseek" },
            { id: "qwen/qwen2-7b-instruct", object: "model", created: Date.now(), owned_by: "qwen" },
            { id: "qwen/qwen2.5-7b-instruct", object: "model", created: Date.now(), owned_by: "qwen" },
            { id: "qwen/qwen2.5-coder-32b-instruct", object: "model", created: Date.now(), owned_by: "qwen" },
            { id: "qwen/qwen2.5-coder-7b-instruct", object: "model", created: Date.now(), owned_by: "qwen" },
            { id: "qwen/qwen3-235b-a22b", object: "model", created: Date.now(), owned_by: "qwen" },
            { id: "qwen/qwq-32b", object: "model", created: Date.now(), owned_by: "qwen" }
          ]
        };
        
        return new Response(JSON.stringify(fallbackModels), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent',
          },
        });
      }
    }

    // --- Main Request Forwarding ---
    // Get the request body to check and potentially modify the model name and parameters
    let requestBodyString = '';
    let modifiedModel = '';
    
    if (request.body) {
      try {
        const bodyText = await request.text();
        const requestBody = JSON.parse(bodyText);
        
        // Check if we need to map the model name
        if (requestBody.model && MODEL_MAPPING[requestBody.model as string]) {
          modifiedModel = requestBody.model;
          requestBody.model = MODEL_MAPPING[requestBody.model as string];
          console.log(`🔄 Model mapping: ${modifiedModel} -> ${requestBody.model}`);
        }
        
        // Fix parameter incompatibilities between OpenAI and NVIDIA APIs
        if (requestBody.max_completion_tokens) {
          requestBody.max_tokens = requestBody.max_completion_tokens;
          delete requestBody.max_completion_tokens;
          console.log(`🔄 Parameter fix: max_completion_tokens -> max_tokens (${requestBody.max_tokens})`);
        }
        
        // Log key parameters for debugging
        console.log(`📊 Request parameters: model=${requestBody.model}, max_tokens=${requestBody.max_tokens || 'unset'}, temperature=${requestBody.temperature || 'unset'}, messages=${requestBody.messages?.length || 0} messages`);
        
        // Remove other potentially incompatible parameters
        const incompatibleParams = ['response_format', 'logprobs', 'top_logprobs', 'parallel_tool_calls', 'tool_choice', 'tools'];
        const removedParams: string[] = [];
        
        for (const param of incompatibleParams) {
          if (requestBody[param] !== undefined) {
            delete requestBody[param];
            removedParams.push(param);
          }
        }
        
        if (removedParams.length > 0) {
          console.log(`🔄 Removed incompatible parameters: ${removedParams.join(', ')}`);
        }
        
        // Convert back to string for forwarding
        requestBodyString = JSON.stringify(requestBody);
      } catch (error) {
        // If parsing fails, use original body
        requestBodyString = await request.text();
      }
    }

    // Create new headers for the NVIDIA API request
    const headers = new Headers(request.headers);

    // Set the Host header to NVIDIA's hostname
    headers.set('Host', new URL(NVIDIA_API_HOST).host);

    // Format the Authorization header correctly for NVIDIA API
    headers.set('Authorization', `Bearer ${apiKey}`);

    // Forward the request to NVIDIA API
    try {
      const startTime = Date.now();
      
      const response = await fetch(new Request(nvidiaUrl.toString(), {
        method: request.method,
        headers: headers,
        body: requestBodyString || undefined,
        redirect: 'follow',
      }));

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Log usage statistics (optional - for your own analytics)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: request.method,
        originalPath: url.pathname,
        cleanPath: cleanPath,
        status: response.status,
        responseTime: responseTime,
        userAgent: request.headers.get('User-Agent') || 'unknown',
        originalModel: modifiedModel || 'no-mapping',
        actualModel: modifiedModel ? MODEL_MAPPING[modifiedModel] : 'no-mapping',
        apiKeyPrefix: apiKey.substring(0, 12) + '...' // Only log first 12 chars for privacy
      }));

      // Create a new response to add CORS headers
      let mutableResponse: Response;
      
      if (hideThinking) {
        // Foolproof filter: only look for closing </think> tag, stream everything after
        try {
          const responseText = await response.text();
          const responseData = JSON.parse(responseText);
          if (responseData.choices && responseData.choices[0] && responseData.choices[0].message && responseData.choices[0].message.content) {
            let content = responseData.choices[0].message.content;
            // Find closing </think> tag
            const closeIdx = content.indexOf('</think>');
            if (closeIdx !== -1) {
              content = content.slice(closeIdx + 8).trim();
              console.log('🧠 Filtered everything before </think> (foolproof mode)');
            } else {
              // If no closing tag, show everything (for models that don't use thinking)
              content = content.trim();
            }
            responseData.choices[0].message.content = content;
          }
          mutableResponse = new Response(JSON.stringify(responseData), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (error) {
          console.log('⚠️ Failed to parse response for thinking removal, using original');
          mutableResponse = new Response(response.body, response);
        }
      } else {
        // Pass through response unchanged
        mutableResponse = new Response(response.body, response);
      }

      // Add comprehensive CORS headers to allow Chub AI and other apps to read the response
      mutableResponse.headers.set('Access-Control-Allow-Origin', '*');
      mutableResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      mutableResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer');

      return mutableResponse;

    } catch (error) {
      // Handle network errors
      console.error('Network error:', error);
      return new Response(JSON.stringify({
        error: {
          message: 'Failed to connect to NVIDIA API. Please check your internet connection.',
          type: 'network_error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-title, x-api-key, Accept, Origin, User-Agent, http-referer, referer',
        },
      });
    }
  },
};

// Environment interface (empty since we're not using environment variables now)
interface Env {
  // No environment variables needed
}
