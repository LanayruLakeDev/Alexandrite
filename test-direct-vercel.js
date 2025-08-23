// Test to see what our proxy is actually sending to Vercel
const VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq';
const VERCEL_DIRECT_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

console.log('🔍 Testing direct Vercel API with provider options...');
console.log('This bypasses our proxy to test provider routing directly');
console.log('─'.repeat(60));

async function testDirectVercelProvider() {
  // Test with providerOptions directly to Vercel (bypass proxy)
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [
      {
        role: "user",
        content: "Say 'Direct Chutes test'"
      }
    ],
    max_tokens: 10,
    temperature: 0.1,
    providerOptions: {
      gateway: {
        only: ['chutes']  // Force Chutes only
      }
    }
  };

  try {
    console.log('📤 Sending DIRECT to Vercel with providerOptions:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await fetch(VERCEL_DIRECT_URL, {
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
      console.log('❌ Error (this might be expected):');
      console.log(errorText);
      
      if (errorText.includes('chutes') || errorText.includes('provider')) {
        console.log('🎯 Good! This confirms Chutes provider restriction works');
      }
      return;
    }

    const data = await response.json();
    
    console.log('✅ Response:');
    console.log('Content:', data.choices[0].message.content);
    
    // Check which provider was actually used
    const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
    if (routing) {
      console.log('\n🔍 Provider routing info:');
      console.log('Final provider:', routing.finalProvider);
      console.log('Available fallbacks:', routing.fallbacksAvailable);
      console.log('Planning reasoning:', routing.planningReasoning);
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Test with a model that should NOT be available on Chutes
async function testUnavailableOnChutes() {
  console.log('\n🧪 Testing model that should NOT be on Chutes...');
  
  const payload = {
    model: 'openai/gpt-4o',  // This should definitely not be on Chutes
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 5,
    providerOptions: {
      gateway: {
        only: ['chutes']  // Should fail
      }
    }
  };

  try {
    const response = await fetch(VERCEL_DIRECT_URL, {
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
      console.log('✅ Expected error - GPT-4o NOT available on Chutes:');
      console.log(errorText);
    } else {
      console.log('❌ Unexpected success - GPT-4o IS on Chutes??');
      const data = await response.json();
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runDirectTests() {
  await testDirectVercelProvider();
  await testUnavailableOnChutes();
  
  console.log('\n📋 CONCLUSIONS:');
  console.log('═'.repeat(50));
  console.log('🎯 If direct Vercel works but proxy doesn\'t:');
  console.log('   → Our proxy isn\'t passing providerOptions correctly');
  console.log('🎯 If both fail the same way:');
  console.log('   → DeepSeek models might always use DeepSeek provider');
  console.log('🎯 If GPT-4o fails with Chutes:');
  console.log('   → Provider restriction is working correctly');
}

runDirectTests();