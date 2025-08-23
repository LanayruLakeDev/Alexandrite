// Test what the DEPLOYED worker is actually doing
const VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq';
const DEPLOYED_WORKER_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🕵️ DETECTIVE MODE: What is the DEPLOYED worker doing?');
console.log('📍 Testing:', DEPLOYED_WORKER_URL);
console.log('─'.repeat(60));

async function testDeployedWorker() {
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [
      {
        role: "user",
        content: "Worker logic test"
      }
    ],
    max_tokens: 5
  };

  try {
    console.log('📤 Sending to DEPLOYED worker...');
    
    const response = await fetch(DEPLOYED_WORKER_URL, {
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
    
    console.log('✅ Response:', data.choices[0].message.content);
    
    // THE KEY EVIDENCE: Check routing metadata
    const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
    if (routing) {
      console.log('\n🔍 DEPLOYED WORKER ROUTING:');
      console.log('Final provider:', routing.finalProvider);
      console.log('Planning reasoning:', routing.planningReasoning);
      
      // Check if deployed worker shows Chutes-only behavior
      if (routing.planningReasoning.includes('Provider set restricted to: chutes')) {
        console.log('✅ DEPLOYED worker HAS the new Chutes-only logic!');
      } else {
        console.log('❌ DEPLOYED worker does NOT have the new logic!');
        console.log('   → Shows old logic with multiple providers');
        console.log('   → Need to deploy the updated code');
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Test with model that should fail if new logic is deployed
async function testShouldFailIfDeployed() {
  console.log('\n🧪 Testing GPT-4o (should FAIL if new logic is deployed)...');
  
  const payload = {
    model: 'openai/gpt-4o',
    messages: [{ role: "user", content: "Test" }],
    max_tokens: 3
  };

  try {
    const response = await fetch(DEPLOYED_WORKER_URL, {
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
      console.log('✅ NEW logic IS deployed - GPT-4o correctly failed:');
      console.log(errorText);
    } else {
      console.log('❌ OLD logic still deployed - GPT-4o succeeded:');
      const data = await response.json();
      const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
      console.log('Used provider:', routing?.finalProvider);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function detectDeployedLogic() {
  await testDeployedWorker();
  await testShouldFailIfDeployed();
  
  console.log('\n📋 VERDICT:');
  console.log('═'.repeat(40));
  console.log('LOCAL CODE: Has providerOptions with Chutes-only');
  console.log('DEPLOYED CODE: Check the routing metadata above');
  console.log('');
  console.log('If routing shows "Provider set restricted to: chutes":');
  console.log('  → ✅ New logic IS deployed');
  console.log('');
  console.log('If routing shows multiple providers available:');
  console.log('  → ❌ Old logic still deployed, need to deploy');
}

detectDeployedLogic();