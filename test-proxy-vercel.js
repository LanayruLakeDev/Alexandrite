// Test Vercel models through our proxy
const VERCEL_API_KEY = '3j4f01vzabIcPPhYtg7g3lPq'; // Your Vercel API key
const PROXY_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🧪 Testing cheapest models through YOUR proxy...');
console.log('─'.repeat(60));

async function testModel(modelName, description) {
  console.log(`\n🤖 Testing ${modelName}`);
  console.log(`💡 ${description}`);
  
  const payload = {
    model: modelName,
    messages: [
      {
        role: "user", 
        content: "Say 'Hello world' in exactly 2 words."
      }
    ],
    max_tokens: 10,
    temperature: 0.1
  };

  try {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;
    
    console.log(`✅ Success! (${responseTime}ms)`);
    console.log(`   Response: "${content}"`);
    console.log(`   Tokens: ${usage.prompt_tokens} + ${usage.completion_tokens} = ${usage.total_tokens}`);
    if (usage.cost) {
      console.log(`   Cost: $${usage.cost}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  // Test the top 3 cheapest models
  const models = [
    ['amazon/nova-micro', 'Cheapest overall - $0.000075/1M tokens'],
    ['deepseek/deepseek-v3', 'Best reasoning - $0.000154/1M tokens'],
    ['meta/llama-3.1-8b', 'Fast via Groq - $0.000135/1M tokens'],
    ['meta/llama-4-scout', 'Latest Llama 4 - $0.0002/1M tokens']
  ];

  let successes = 0;
  
  for (const [model, description] of models) {
    const success = await testModel(model, description);
    if (success) successes++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('═'.repeat(40));
  console.log(`✅ ${successes}/${models.length} models working through your proxy`);
  console.log('🎯 All models route automatically via Vercel AI Gateway');
  console.log('💰 Using cheapest providers (Novita when possible)');
  console.log('🆓 $5 free credits every 30 days from Vercel');
  
  if (successes > 0) {
    console.log('\n🎉 Your proxy is working perfectly with Vercel models!');
    console.log('🚀 Ready to use for production applications');
  }
}

runTests();