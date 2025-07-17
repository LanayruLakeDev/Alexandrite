// Test script to verify model mapping works
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const PROXY_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🧪 Testing Model Mapping Feature...');
console.log('📡 Sending "gpt-4o" -> should become "deepseek-ai/deepseek-r1"');
console.log('─'.repeat(60));

async function testModelMapping() {
  const payload = {
    model: 'gpt-4o', // This should be mapped to deepseek-ai/deepseek-r1
    messages: [
      {
        role: "user",
        content: "Hello! Tell me what model you are in one sentence."
      }
    ],
    temperature: 0.7,
    max_tokens: 100,
    stream: false
  };

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n🤖 AI Response:');
      console.log(data.choices[0].message.content);
      console.log('\n📝 Model in response:', data.model);
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testModelMapping();
