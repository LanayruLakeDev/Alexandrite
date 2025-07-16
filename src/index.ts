/**
 * NVIDIA NIM Proxy for JanitorAI
 * This proxy allows users to use their own NVIDIA API keys with JanitorAI
 * by handling CORS and authentication header formatting.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // The target host for the NVIDIA API
    const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com';

    // Create a new URL object based on the incoming request
    const url = new URL(request.url);

    // Build the new URL for the NVIDIA API
    const nvidiaUrl = new URL(NVIDIA_API_HOST + url.pathname + url.search);

    // --- CORS Pre-flight Request Handling ---
    // Browsers send an OPTIONS request first to check if the actual request is safe
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
          message: 'API key is required. Please provide your NVIDIA API key.',
          type: 'authentication_error'
        }
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
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
        },
      });
    }

    // --- Main Request Forwarding ---
    // Create new headers for the NVIDIA API request
    const headers = new Headers(request.headers);

    // Set the Host header to NVIDIA's hostname
    headers.set('Host', new URL(NVIDIA_API_HOST).host);

    // Format the Authorization header correctly for NVIDIA API
    headers.set('Authorization', `Bearer ${apiKey}`);

    // Forward the request to NVIDIA API
    try {
      const response = await fetch(new Request(nvidiaUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'follow',
      }));

      // Create a new response to add CORS headers
      const mutableResponse = new Response(response.body, response);

      // Add CORS header to allow any website to read the response
      mutableResponse.headers.set('Access-Control-Allow-Origin', '*');

      return mutableResponse;

    } catch (error) {
      // Handle network errors
      return new Response(JSON.stringify({
        error: {
          message: 'Failed to connect to NVIDIA API. Please check your internet connection.',
          type: 'network_error'
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// Environment interface (empty since we're not using environment variables now)
interface Env {
  // No environment variables needed
}
