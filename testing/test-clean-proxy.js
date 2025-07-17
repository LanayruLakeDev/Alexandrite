// Test the clean proxy with QwQ model
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const PROXY_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';
const MODEL = 'qwen/qwq-32b';

console.log('🧪 Testing clean proxy with QwQ...');
console.log(`📡 Proxy URL: ${PROXY_URL}`);
console.log(`🤖 Model: ${MODEL}`);
console.log('─'.repeat(60));

async function testCleanProxy() {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "What is 5 + 3? Show your work."
      }
    ],
    temperature: 0.7,
    max_tokens: 500,
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
    const content = data.choices[0].message.content;
    
    console.log('✅ Proxy working! Response:');
    console.log('─'.repeat(60));
    console.log(content);
    console.log('─'.repeat(60));
    
    // Check if thinking tokens are present (should be, since we're not filtering)
    if (content.includes('</think>')) {
      console.log('🧠 Thinking tokens present (as expected)');
    } else {
      console.log('📝 No thinking tokens (clean response)');
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testCleanProxy();
