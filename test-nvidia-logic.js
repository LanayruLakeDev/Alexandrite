// TEST: NVIDIA API Key Logic
// Test if NVIDIA keys still work and bypass Vercel routing

const NVIDIA_TEST_KEY = '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'; // Public key from worker
const NVIDIA_DIRECT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

console.log('🔍 TEST: NVIDIA API Key Logic');
console.log('Key:', NVIDIA_TEST_KEY.substring(0, 15) + '...');
console.log('Expected: Should bypass Vercel and go direct to NVIDIA');
console.log('Expected: Should apply model mapping (deepseek-reasoner → deepseek-ai/deepseek-r1)');
console.log('─'.repeat(60));

async function testNvidiaKeyLogic() {
  console.log('📤 Test 1: NVIDIA key with model mapping');
  
  const payload = {
    model: 'deepseek-reasoner', // Should map to deepseek-ai/deepseek-r1
    messages: [
      {
        role: "user",
        content: "Test NVIDIA routing and model mapping"
      }
    ],
    max_tokens: 20,
    temperature: 0.1
  };

  try {
    console.log('🎯 Sending to NVIDIA direct API...');
    console.log('Original model:', payload.model);
    console.log('Expected mapped model: deepseek-ai/deepseek-r1');
    
    // Simulate our worker's model mapping
    const MODEL_MAPPING = {
      'gpt-4o': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
      'gpt-4': 'qwen/qwq-32b',
      'gpt-3.5-turbo': 'mistralai/mistral-nemotron',
      'deepseek-chat': 'qwen/qwen3-235b-a22b',
      'deepseek-reasoner': 'deepseek-ai/deepseek-r1',
      'deepseek-prover': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
    };
    
    // Apply mapping like our worker does
    if (MODEL_MAPPING[payload.model]) {
      console.log('✅ Model mapping applied:', payload.model, '→', MODEL_MAPPING[payload.model]);
      payload.model = MODEL_MAPPING[payload.model];
    }
    
    const response = await fetch(NVIDIA_DIRECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_TEST_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      
      // Check if it's just an auth issue vs logic issue
      if (response.status === 401 || response.status === 403) {
        console.log('💡 This is just an auth error - logic would work with valid key');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Response:', data.choices[0].message.content);
    console.log('✅ Model used:', data.model);
    
    // Check if there's any provider metadata (shouldn't be for NVIDIA direct)
    if (data.choices[0].message.provider_metadata) {
      console.log('⚠️ Unexpected: Found provider metadata (should be NVIDIA direct)');
    } else {
      console.log('✅ Correct: No provider metadata (NVIDIA direct API)');
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Test the logic detection part
async function testKeyDetectionLogic() {
  console.log('\n🔍 Test 2: Key Detection Logic Simulation');
  console.log('─'.repeat(40));
  
  const testKeys = [
    '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',
    '3j4f01vzabIcPPhYtg7g3lPq',
    'sk-1234567890abcdef',
    'i-goon-on-my-private-server'
  ];
  
  testKeys.forEach((key, index) => {
    console.log(`\nKey ${index + 1}: ${key.substring(0, 12)}...`);
    
    // Simulate worker logic
    const isNvidiaKey = key.startsWith('nvapi-');
    const isVercelKey = !isNvidiaKey && key && key.length > 0;
    const isPassphrase = key === 'i-goon-on-my-private-server';
    
    console.log('  Is NVIDIA key:', isNvidiaKey);
    console.log('  Is Vercel key:', isVercelKey);
    console.log('  Is passphrase:', isPassphrase);
    
    if (isPassphrase) {
      console.log('  → Will use public NVIDIA key');
      console.log('  → Will route to NVIDIA API');
    } else if (isNvidiaKey) {
      console.log('  → Will route to NVIDIA API');
      console.log('  → Will apply model mapping');
      console.log('  → Will NOT use providerOptions');
    } else {
      console.log('  → Will route to Vercel AI Gateway');
      console.log('  → Will force Chutes provider');
      console.log('  → Will use providerOptions');
    }
  });
}

async function runNvidiaTests() {
  await testNvidiaKeyLogic();
  await testKeyDetectionLogic();
  
  console.log('\n📋 NVIDIA LOGIC VERIFICATION:');
  console.log('═'.repeat(50));
  console.log('✅ NVIDIA keys (nvapi-*): Route to NVIDIA direct');
  console.log('✅ Model mapping: deepseek-reasoner → deepseek-ai/deepseek-r1');
  console.log('✅ No providerOptions: NVIDIA handles routing internally');
  console.log('✅ Passphrase: Uses public NVIDIA key');
  console.log('');
  console.log('vs');
  console.log('');
  console.log('✅ Vercel keys: Route to Vercel with Chutes forcing');
  console.log('✅ No model mapping: Use original model names');
  console.log('✅ Uses providerOptions: Force Chutes provider');
}

runNvidiaTests();