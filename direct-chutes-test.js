// DIRECT TEST: Your exact scenario
// Vercel API key + DeepSeek V3.1 = Should go to Chutes

const YOUR_VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq';
const VERCEL_DIRECT_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

console.log('🎯 DIRECT TEST: Your exact scenario');
console.log('Key:', YOUR_VERCEL_API_KEY);
console.log('Model: deepseek/deepseek-v3.1');
console.log('Expected: Should use Chutes provider with providerOptions');
console.log('─'.repeat(60));

async function testYourExactScenario() {
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [
      {
        role: "user",
        content: "Direct Chutes routing test"
      }
    ],
    max_tokens: 10,
    temperature: 0.1,
    // THIS IS THE KEY: Force Chutes provider
    providerOptions: {
      gateway: {
        only: ['chutes']  // STRICT: Only Chutes, fail if not available
      }
    }
  };

  try {
    console.log('📤 Sending DIRECT to Vercel with providerOptions:');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(VERCEL_DIRECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOUR_VERCEL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Success! Response:', data.choices[0].message.content);
    
    // CHECK THE CRITICAL EVIDENCE
    const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
    if (routing) {
      console.log('\n🔍 CRITICAL ROUTING INFO:');
      console.log('Final provider used:', routing.finalProvider);
      console.log('Planning reasoning:', routing.planningReasoning);
      
      if (routing.finalProvider === 'chutes') {
        console.log('🎉 CONFIRMED: Your scenario WILL use Chutes!');
        console.log('💰 This means cheapest pricing: $0.20 input + $0.80 output');
      } else {
        console.log('❌ WARNING: Did NOT use Chutes provider!');
        console.log('   Used instead:', routing.finalProvider);
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Also test without providerOptions to see the difference
async function testWithoutProviderOptions() {
  console.log('\n🧪 COMPARISON: Same request WITHOUT providerOptions');
  console.log('Expected: Will use default provider (probably DeepSeek direct)');
  console.log('─'.repeat(40));
  
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [
      {
        role: "user",
        content: "Default routing test"
      }
    ],
    max_tokens: 10,
    temperature: 0.1
    // NO providerOptions - let Vercel decide
  };

  try {
    const response = await fetch(VERCEL_DIRECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOUR_VERCEL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
      
      console.log('✅ Default routing used:', routing?.finalProvider);
      console.log('Available providers:', routing?.fallbacksAvailable);
      
      if (routing?.finalProvider !== 'chutes') {
        console.log('💡 This proves providerOptions is needed to force Chutes!');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runDirectTest() {
  await testYourExactScenario();
  await testWithoutProviderOptions();
  
  console.log('\n📋 CONCLUSION:');
  console.log('═'.repeat(50));
  console.log('If first test used Chutes AND second test used different provider:');
  console.log('  ✅ Your scenario WILL work correctly');
  console.log('  ✅ Our worker logic is correct');
  console.log('  ✅ Ready to deploy!');
  console.log('');
  console.log('If both tests used same provider:');
  console.log('  ❌ Provider forcing might not work as expected');
}

runDirectTest();