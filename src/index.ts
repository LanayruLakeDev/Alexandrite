import { OpenAI } from 'openai';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
      if (url.pathname === '/v1/chat/completions' && request.method === 'POST') {
        const body = await request.json() as any;
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response('Missing or invalid authorization', { status: 401 });
        }
        
        const apiKey = authHeader.substring(7);
        
        // Debug API key for reasoning requests
        if (body.model === 'deepseek-reasoner') {
          console.log('🧠 REASONING REQUEST - deepseek-reasoner model detected');
        }
        
        // Check if this is a reasoning request
        if (body.model === 'deepseek-reasoner') {
          console.log('🧠 REASONING REQUEST - deepseek-reasoner model detected');
          
          // Check if the user provided an NVIDIA API key
          if (!apiKey.startsWith('nvapi-')) {
            return new Response(JSON.stringify({
              error: { 
                message: 'NVIDIA API key required for reasoning. Please use an NVIDIA API key starting with "nvapi-" in your Janitor AI settings.',
                type: 'authentication_error'
              }
            }), { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          console.log('✅ Using NVIDIA API key from Janitor AI settings');
          return handleReasoningPassthrough(body, apiKey, corsHeaders);
        }
        
        // Handle other models with existing logic
        console.log('🤖 Regular model request:', body.model);
        
        // Determine provider based on model
        if (body.model.includes('qwen') || body.model.includes('deepseek') || body.model.includes('llama') || body.model.includes('nvidia/')) {
          console.log('📡 Routing to NVIDIA for model:', body.model);
          return await handleNVIDIARequest(body, apiKey, corsHeaders);
        } else {
          console.log('📡 Routing to OpenAI for model:', body.model);
          return await handleOpenAIRequest(body, apiKey, corsHeaders);
        }
      }
      
      return new Response('Not found', { status: 404 });
      
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal server error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

// Handle NVIDIA requests (existing models)
async function handleNVIDIARequest(body: any, apiKey: string, corsHeaders: any): Promise<Response> {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': body.stream ? 'text/event-stream' : 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} ${errorText}`);
    }
    
    if (body.stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } else {
      const responseData = await response.json();
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('NVIDIA API error:', error);
    return new Response(JSON.stringify({ 
      error: { message: 'NVIDIA API error: ' + error.message } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle OpenAI requests
async function handleOpenAIRequest(body: any, apiKey: string, corsHeaders: any): Promise<Response> {
  try {
    const openai = new OpenAI({ apiKey: apiKey });
    const response = await openai.chat.completions.create(body);
    
    if (body.stream) {
      // For streaming, we need to handle differently
      return new Response(JSON.stringify({ error: { message: 'OpenAI streaming not implemented in this version' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(JSON.stringify({ 
      error: { message: 'OpenAI API error: ' + error.message } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleReasoningPassthrough(requestBody: any, apiKey: string, corsHeaders: any): Promise<Response> {
  const startTime = Date.now();
  const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
  
  console.log('🚀 [' + sessionId + '] REASONING SESSION STARTED');
  
  try {
    // Prepare NVIDIA request
    const nvidiaRequest = {
      ...requestBody,
      model: 'deepseek-ai/deepseek-v3.1',
      chat_template_kwargs: { "thinking": true },
      stream: true
    };

    // Make request to NVIDIA
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'Mozilla/5.0 (compatible; OpenAI-JavaScript/4.0.0)'
      },
      body: JSON.stringify(nvidiaRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    console.log('✅ [' + sessionId + '] NVIDIA responded, starting passthrough...');

    // Create passthrough stream
    const readable = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            let reasoningCount = 0;
            let contentCount = 0;
            let totalChunks = 0;
            let fullReasoning = '';
            let fullContent = '';
            let buffer = ''; // Accumulate partial chunks

            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('📊 [' + sessionId + '] FINAL RESULTS:');
                console.log('🧠 FULL REASONING:', fullReasoning || '(none)');
                console.log('💬 FULL ANSWER:', fullContent || '(none)');
                console.log('🔢 Total chunks processed:', totalChunks);
                break;
              }

              totalChunks++;
              
              // Forward NVIDIA data exactly as received
              controller.enqueue(value);

              // Accumulate text in buffer for proper parsing
              try {
                const text = decoder.decode(value, { stream: true });
                buffer += text;
                
                // Split by double newlines to get complete SSE events
                const events = buffer.split('\n\n');
                // Keep the last incomplete event in buffer
                buffer = events.pop() || '';
                
                for (const event of events) {
                  if (!event.trim()) continue;
                  
                  const lines = event.split('\n');
                  for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    
                    const dataContent = line.substring(6).trim();
                    if (dataContent === '[DONE]') continue;

                    try {
                      const chunk = JSON.parse(dataContent);
                      
                      if (chunk.choices?.[0]?.delta) {
                        const delta = chunk.choices[0].delta;
                        
                        if (delta.reasoning_content) {
                          reasoningCount++;
                          fullReasoning += delta.reasoning_content;
                          console.log('🧠 [' + sessionId + '] +REASONING #' + reasoningCount + ': "' + delta.reasoning_content + '"');
                        }
                        
                        if (delta.content) {
                          contentCount++;
                          fullContent += delta.content;
                          console.log('💬 [' + sessionId + '] +CONTENT #' + contentCount + ': "' + delta.content + '"');
                        }
                      }
                      
                    } catch (parseError) {
                      console.log('⚠️ [' + sessionId + '] Parse error: ' + parseError.message);
                    }
                  }
                }
              } catch (decodeError) {
                console.log('⚠️ [' + sessionId + '] Decode error: ' + decodeError.message);
              }
            }

          } catch (error) {
            console.error('❌ [' + sessionId + '] Stream error:', error.message);
            controller.error(error);
          } finally {
            controller.close();
          }
        })();
      }
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('❌ [' + sessionId + '] Passthrough failed:', error.message);
    
    return new Response(JSON.stringify({ 
      error: { 
        message: 'Passthrough failed: ' + error.message,
        type: 'passthrough_error',
        session_id: sessionId
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
