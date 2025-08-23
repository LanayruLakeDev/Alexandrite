// Cloudflare Worker Simulation - Local Testing
// This simulates our worker logic locally so we can test before deploying

const VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq';
const NVIDIA_API_HOST = 'https://integrate.api.nvidia.com';

// Model mapping (from our worker)
const MODEL_MAPPING = {
  'gpt-4o': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'gpt-4': 'qwen/qwq-32b',
  'gpt-3.5-turbo': 'mistralai/mistral-nemotron',
  'deepseek-chat': 'qwen/qwen3-235b-a22b',
  'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
  'deepseek-prover': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
};

// Public API key for passphrase users
const PUBLIC_API_KEY = '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';
const SECRET_PASSPHRASE = 'i-goon-on-my-private-server';

console.log('🔧 CLOUDFLARE WORKER SIMULATION');
console.log('Testing our worker logic locally before deployment');
console.log('═'.repeat(60));

// Simulate the worker's main logic
async function simulateWorker(requestData) {
  console.log('\n📥 SIMULATING WORKER REQUEST...');
  console.log('Request:', JSON.stringify(requestData, null, 2));

  try {
    // 1. Extract and process API key
    let apiKey = requestData.headers.Authorization?.replace('Bearer ', '') || '';
    
    let keySource = 'User-provided';
    if (apiKey === SECRET_PASSPHRASE) {
      apiKey = PUBLIC_API_KEY;
      keySource = 'Public (via passphrase)';
    }
    
    console.log('🔑 API Key Source:', keySource);
    console.log('🔑 Key starts with:', apiKey.substring(0, 12) + '...');

    // 2. VERCEL AI GATEWAY DETECTION & ROUTING
    const isNvidiaKey = apiKey?.startsWith('nvapi-');
    const isVercelKey = !isNvidiaKey && apiKey && apiKey.length > 0;
    let targetEndpoint = NVIDIA_API_HOST;
    let isVercelRequest = false;
    
    if (isVercelKey) {
      targetEndpoint = 'https://ai-gateway.vercel.sh';
      isVercelRequest = true;
      keySource = 'Vercel AI Gateway';
    }

    console.log('🎯 Target Endpoint:', targetEndpoint);
    console.log('🎯 Is Vercel Request:', isVercelRequest);

    // 3. Process request body
    let requestBody = requestData.body;
    let modifiedModel = '';
    let isStreaming = false;
    let isVercelModel = false;
    
    if (requestBody) {
      // Detect Vercel AI Gateway models
      if (requestBody.model) {
        isVercelModel = requestBody.model.includes('/') || 
                        requestBody.model.includes('anthropic') ||
                        requestBody.model.includes('openai') ||
                        requestBody.model.includes('vercel');
        
        console.log('🤖 Model:', requestBody.model);
        console.log('🤖 Is Vercel Model:', isVercelModel);
        
        // Force Chutes as ONLY provider for Vercel requests (cheapest!)
        if (isVercelRequest) {
          console.log('💰 FORCING CHUTES PROVIDER (cheapest!)');
          requestBody.providerOptions = {
            gateway: {
              only: ['chutes'],  // STRICT: Only use Chutes, fail if not available
            }
          };
          console.log('✅ Added providerOptions:', JSON.stringify(requestBody.providerOptions, null, 2));
        }
        
        // Apply NVIDIA model mapping only when using NVIDIA API keys
        if (!isVercelRequest && requestBody.model && MODEL_MAPPING[requestBody.model]) {
          modifiedModel = requestBody.model;
          requestBody.model = MODEL_MAPPING[requestBody.model];
          console.log('🔄 Model Mapping:', modifiedModel, '→', requestBody.model);
        }
      }
      
      // Check for streaming
      isStreaming = requestBody?.stream === true;
      console.log('📡 Streaming:', isStreaming);
      
      // Parameter normalization
      if (requestBody?.max_completion_tokens) {
        requestBody.max_tokens = requestBody.max_completion_tokens;
        delete requestBody.max_completion_tokens;
        console.log('🔧 Normalized max_completion_tokens → max_tokens');
      }
      
      // Set default max_tokens
      if (!requestBody?.max_tokens) {
        requestBody.max_tokens = 4096;
        console.log('🔧 Set default max_tokens: 4096');
      } else if (requestBody.max_tokens === 0) {
        requestBody.max_tokens = 32768;
        console.log('🔧 Converted max_tokens 0 → 32768');
      }
    }

    // 4. FORWARD REQUEST TO TARGET API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Set target-specific headers
    if (isVercelRequest) {
      headers['Host'] = 'ai-gateway.vercel.sh';
      console.log('🏢 Added Vercel headers');
    } else {
      headers['Host'] = new URL(NVIDIA_API_HOST).hostname;
      console.log('🏢 Added NVIDIA headers');
    }
    
    const targetUrl = isVercelRequest 
      ? `https://ai-gateway.vercel.sh/v1/chat/completions`
      : `${NVIDIA_API_HOST}/v1/chat/completions`;
    
    console.log('🎯 Final Target URL:', targetUrl);
    console.log('🎯 Final Headers:', JSON.stringify(headers, null, 2));
    console.log('🎯 Final Request Body:', JSON.stringify(requestBody, null, 2));

    // 5. MAKE THE ACTUAL REQUEST
    console.log('\n📤 MAKING ACTUAL REQUEST TO VERCEL...');
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    
    // Check routing metadata
    const routing = data.choices?.[0]?.message?.provider_metadata?.gateway?.routing;
    if (routing) {
      console.log('\n🔍 PROVIDER ROUTING RESULTS:');
      console.log('Final provider used:', routing.finalProvider);
      console.log('Planning reasoning:', routing.planningReasoning);
      
      if (routing.finalProvider === 'chutes') {
        console.log('🎉 SUCCESS! Used Chutes provider (cheapest)');
      } else {
        console.log('⚠️ WARNING! Did not use Chutes provider');
      }
    }
    
    console.log('✅ Response:', data.choices?.[0]?.message?.content);
    return { success: true, data: data };
    
  } catch (error) {
    console.log('❌ Simulation Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testDeepSeek() {
  console.log('\n🧪 TEST 1: DeepSeek V3.1 (should use Chutes)');
  console.log('─'.repeat(40));
  
  const testRequest = {
    headers: {
      Authorization: `Bearer ${VERCEL_API_KEY}`
    },
    body: {
      model: 'deepseek/deepseek-v3.1',
      messages: [
        {
          role: "user",
          content: "Say 'Chutes test successful'"
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    }
  };
  
  await simulateWorker(testRequest);
}

async function testGPT4o() {
  console.log('\n🧪 TEST 2: GPT-4o (should FAIL with Chutes-only)');
  console.log('─'.repeat(40));
  
  const testRequest = {
    headers: {
      Authorization: `Bearer ${VERCEL_API_KEY}`
    },
    body: {
      model: 'openai/gpt-4o',
      messages: [
        {
          role: "user", 
          content: "This should fail"
        }
      ],
      max_tokens: 5
    }
  };
  
  await simulateWorker(testRequest);
}

async function testNVIDIAKey() {
  console.log('\n🧪 TEST 3: NVIDIA Key (should bypass Chutes)');
  console.log('─'.repeat(40));
  
  const testRequest = {
    headers: {
      Authorization: `Bearer nvapi-test-key`
    },
    body: {
      model: 'deepseek-reasoner',
      messages: [
        {
          role: "user",
          content: "NVIDIA test"
        }
      ],
      max_tokens: 10
    }
  };
  
  await simulateWorker(testRequest);
}

// Run all tests
async function runSimulation() {
  await testDeepSeek();
  await testGPT4o();
  await testNVIDIAKey();
  
  console.log('\n📋 SIMULATION COMPLETE');
  console.log('═'.repeat(40));
  console.log('🎯 If DeepSeek used Chutes: ✅ Provider forcing works');
  console.log('🎯 If GPT-4o failed: ✅ Chutes-only restriction works');
  console.log('🎯 If NVIDIA bypassed Vercel: ✅ Key detection works');
  console.log('\n🚀 Once all tests pass, we can deploy to the real worker!');
}

runSimulation();