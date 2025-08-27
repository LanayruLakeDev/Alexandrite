// Test Chutes provider routing through proxy
const VERCEL_API_KEY = 'REPLACE_WITH_YOUR_ACTUAL_VERCEL_KEY'; // ⚠️ REMOVED FOR SECURITY
const PROXY_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🧪 Testing CHUTES provider routing...');
console.log('Expected: Chutes provider (cheapest) or error if model not available');
console.log('─'.repeat(60));

async function testChutesRouting() {
  // Test DeepSeek V3.1 which should be available on Chutes
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [
      {
        role: "user",
        content: "Say 'Hello from Chutes' in exactly those words."
      }
    ],
    max_tokens: 20,
    temperature: 0.1
  };

  try {
    console.log('📤 Sending request with Chutes provider routing...');
    console.log('Model:', payload.model);
    
    const start = Date.now();
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VERCEL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const responseTime = Date.now() - start;

    console.log(`📊 Response Status: ${response.status} ${response.statusText} (${responseTime}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      
      // Check if it's a provider-related error
      if (errorText.includes('provider') || errorText.includes('chutes')) {
        console.log('🎯 This might be the expected "model not available on Chutes" error');
      }
      return;
    }

    const data = await response.json();
    
    console.log('✅ Success! Response:');
    console.log('Content:', data.choices[0].message.content);
    
    // Check for provider metadata to see which provider was actually used
    if (data.usage) {
      console.log('Usage:', JSON.stringify(data.usage, null, 2));
    }
    
    console.log('\n🔍 Full response structure:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Test a model that might NOT be available on Chutes
async function testModelNotOnChutes() {
  console.log('\n🧪 Testing model that might NOT be on Chutes...');
  
  const payload = {
    model: 'anthropic/claude-3.5-sonnet', // This might not be on Chutes
    messages: [
      {
        role: "user", 
        content: "Hello"
      }
    ],
    max_tokens: 10
  };

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VERCEL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Expected error (model not on Chutes):');
      console.log(errorText);
    } else {
      const data = await response.json();
      console.log('✅ Unexpected success - model IS available on Chutes:');
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function runTests() {
  await testChutesRouting();
  await testModelNotOnChutes();
  
  console.log('\n📋 SUMMARY:');
  console.log('═'.repeat(40));
  console.log('🎯 Proxy now forces Chutes provider (cheapest)');
  console.log('💡 If model not on Chutes, should return error');
  console.log('🔧 This enforces cheapest pricing: $0.20 input + $0.80 output');
}

runTests();