// Quick test to verify deployed worker is working correctly
const VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq';
const DEPLOYED_WORKER_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🧪 TESTING DEPLOYED WORKER...');
console.log('Expected: Chutes provider for Vercel keys');
console.log('─'.repeat(40));

async function testDeployedWorker() {
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [{ role: "user", content: "Deployment test" }],
    max_tokens: 5
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

    if (response.ok) {
      const data = await response.json();
      const routing = data.choices[0].message.provider_metadata?.gateway?.routing;
      
      if (routing?.finalProvider === 'chutes') {
        console.log('✅ SUCCESS! Deployed worker uses Chutes provider');
        console.log('💰 Cheapest pricing active: $0.20 input + $0.80 output');
      } else {
        console.log('❌ ISSUE! Used provider:', routing?.finalProvider);
        console.log('Expected: chutes');
      }
    } else {
      console.log('❌ Request failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDeployedWorker();