// Debug what our proxy is actually sending to Vercel
const VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq';
const PROXY_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🔍 Debug: Testing what our proxy sends to Vercel...');
console.log('─'.repeat(60));

// Let's create a minimal test that should work
async function debugProxyRequest() {
  // Simple test that should force Chutes
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [
      {
        role: "user",
        content: "Debug test"
      }
    ],
    max_tokens: 5
  };

  try {
    console.log('📤 Sending through OUR PROXY:');
    console.log('Expected: Should add providerOptions.gateway.only = ["chutes"]');
    
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
      console.log('❌ Error:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Response:');
    console.log('Content:', data.choices[0].message.content);
    
    // Check routing metadata
    const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
    if (routing) {
      console.log('\n🔍 CRITICAL - Provider routing info:');
      console.log('Final provider used:', routing.finalProvider);
      console.log('Planning reasoning:', routing.planningReasoning);
      
      if (routing.finalProvider === 'chutes') {
        console.log('🎉 SUCCESS! Proxy correctly forced Chutes provider');
      } else {
        console.log('❌ FAILURE! Proxy did NOT force Chutes provider');
        console.log('   Expected: chutes');
        console.log('   Actual:', routing.finalProvider);
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Test with a model that should definitely fail on Chutes-only
async function testShouldFail() {
  console.log('\n🧪 Testing model that SHOULD FAIL with Chutes-only...');
  
  const payload = {
    model: 'openai/gpt-4o',  // Not available on Chutes
    messages: [{ role: "user", content: "Test" }],
    max_tokens: 5
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

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('✅ GOOD! Expected failure - GPT-4o not on Chutes:');
      console.log(errorText);
    } else {
      console.log('❌ BAD! Should have failed but succeeded:');
      const data = await response.json();
      const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
      console.log('Used provider:', routing?.finalProvider);
      console.log('This means proxy is NOT forcing Chutes-only');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runDebug() {
  await debugProxyRequest();
  await testShouldFail();
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('═'.repeat(50));
  console.log('If DeepSeek worked with Chutes AND GPT-4o failed:');
  console.log('  ✅ Proxy is working correctly!');
  console.log('');
  console.log('If DeepSeek used different provider OR GPT-4o succeeded:');
  console.log('  ❌ Proxy is NOT adding providerOptions correctly');
  console.log('  🔧 Need to debug request forwarding');
}

runDebug();