// Native fetch (Node.js 18+)

const VERCEL_API_KEY = 'REPLACE_WITH_YOUR_ACTUAL_VERCEL_KEY'; // ⚠️ REMOVED FOR SECURITY
const VERCEL_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';

async function testVercelDeepSeek() {
  console.log('🚀 Testing Vercel AI Gateway with DeepSeek V3...');
  
  const requestBody = {
    model: 'deepseek/deepseek-v3',  // Correct model name from Vercel docs
    messages: [
      {
        role: 'user',
        content: 'Why is the sky blue? Please explain the science behind it in simple terms.'
      }
    ],
    max_tokens: 500,
    temperature: 0.7,
    stream: false
  };

  try {
    console.log('📡 Sending request to Vercel AI Gateway...');
    console.log('Model:', requestBody.model);
    console.log('Message:', requestBody.messages[0].content);
    console.log('💰 Pricing: ~$0.28-0.90/M input tokens, ~$0.77-1.15/M output tokens (varies by provider)');
    console.log('🆓 You get $5 free credits every 30 days!');
    console.log('---');

    const response = await fetch(VERCEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received!');
    console.log('Model used:', data.model);
    console.log('Usage:', data.usage);
    console.log('---');
    console.log('🤖 DeepSeek v3 Response:');
    console.log(data.choices[0].message.content);
    console.log('---');
    console.log('✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try to get more error details
    if (error.response) {
      try {
        const errorData = await error.response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
    }
  }
}

// Test available models first
async function listModels() {
  console.log('📋 Fetching available models...');
  
  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Available models:');
    data.data.forEach(model => {
      if (model.id.includes('deepseek')) {
        console.log(`✨ ${model.id} - ${model.owned_by || 'N/A'} (DeepSeek model)`);
      } else {
        console.log(`   ${model.id} - ${model.owned_by || 'N/A'}`);
      }
    });
    console.log('---');
    
  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
  }
}

// Run tests
async function main() {
  await listModels();
  await testVercelDeepSeek();
}

main();
