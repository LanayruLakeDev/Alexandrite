// Test Vercel AI Gateway with Novita AI provider specifically

const VERCEL_API_KEY = 'REPLACE_WITH_YOUR_ACTUAL_VERCEL_KEY'; // ⚠️ REMOVED FOR SECURITY
const VERCEL_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';

async function testVercelNovita() {
  console.log('🚀 Testing Vercel AI Gateway with Novita AI provider...');
  
  const requestBody = {
    model: 'deepseek/deepseek-v3',
    messages: [
      {
        role: 'user',
        content: 'Why is the sky blue? Please explain briefly.'
      }
    ],
    max_tokens: 200,
    temperature: 0.7,
    stream: false,
    // Force routing to Novita AI provider
    provider: 'novita'
  };

  try {
    console.log('📡 Sending request to Vercel AI Gateway...');
    console.log('Model:', requestBody.model);
    console.log('Provider: Novita AI (forced routing)');
    console.log('💰 Novita Pricing: $0.28/M input, $1.14/M output tokens (cheapest!)');
    console.log('---');

    const response = await fetch(VERCEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json',
        // Alternative way to specify provider via header
        'X-Vercel-AI-Provider': 'novita'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received from Novita AI!');
    console.log('Model used:', data.model);
    console.log('Usage:', data.usage);
    console.log('Provider info:', data.provider || 'Not specified in response');
    console.log('---');
    console.log('🤖 DeepSeek V3 (via Novita) Response:');
    console.log(data.choices[0].message.content);
    console.log('---');
    console.log('✨ Novita AI test completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test different provider routing methods
async function testProviderMethods() {
  console.log('🔍 Testing different provider routing methods...\n');
  
  // Method 1: In request body
  await testProviderInBody();
  
  // Method 2: In header
  await testProviderInHeader();
  
  // Method 3: Compare with auto-routing
  await testAutoRouting();
}

async function testProviderInBody() {
  console.log('📋 Method 1: Provider in request body');
  const requestBody = {
    model: 'deepseek/deepseek-v3',
    messages: [{ role: 'user', content: 'Hello from method 1!' }],
    max_tokens: 50,
    provider: 'novita'  // Force Novita
  };
  
  try {
    const response = await fetch(VERCEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Body method works! Usage:', data.usage?.total_tokens, 'tokens');
    } else {
      console.log('❌ Body method failed:', response.status);
    }
  } catch (e) {
    console.log('❌ Body method error:', e.message);
  }
  console.log('');
}

async function testProviderInHeader() {
  console.log('📋 Method 2: Provider in header');
  const requestBody = {
    model: 'deepseek/deepseek-v3',
    messages: [{ role: 'user', content: 'Hello from method 2!' }],
    max_tokens: 50
  };
  
  try {
    const response = await fetch(VERCEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Vercel-AI-Provider': 'novita'  // Force Novita via header
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Header method works! Usage:', data.usage?.total_tokens, 'tokens');
    } else {
      console.log('❌ Header method failed:', response.status);
    }
  } catch (e) {
    console.log('❌ Header method error:', e.message);
  }
  console.log('');
}

async function testAutoRouting() {
  console.log('📋 Method 3: Auto-routing (no provider specified)');
  const requestBody = {
    model: 'deepseek/deepseek-v3',
    messages: [{ role: 'user', content: 'Hello from auto-routing!' }],
    max_tokens: 50
  };
  
  try {
    const response = await fetch(VERCEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auto-routing works! Usage:', data.usage?.total_tokens, 'tokens');
    } else {
      console.log('❌ Auto-routing failed:', response.status);
    }
  } catch (e) {
    console.log('❌ Auto-routing error:', e.message);
  }
  console.log('');
}

// Run the tests
async function main() {
  await testVercelNovita();
  console.log('\n' + '='.repeat(60) + '\n');
  await testProviderMethods();
}

main();
