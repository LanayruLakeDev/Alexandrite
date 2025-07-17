// Test script to verify thinking trace removal works
// Test script to verify thinking trace removal works
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key

console.log('🧠 Testing Thinking Trace Filtering...');
console.log('─'.repeat(60));

async function testThinkingFilter() {
  // Check if API key is set
  if (API_KEY === 'nvapi-YOUR-API-KEY-HERE') {
    console.log('❌ Please set your NVIDIA API key in this file first!');
    console.log('📝 Edit line 2 and replace "nvapi-YOUR-API-KEY-HERE" with your actual key');
    return;
  }
  // Test with thinking filter enabled
  const testWithFilter = async () => {
    console.log('\n🎯 TEST 1: WITH thinking filter (hide_thinking=true)');
    console.log('Expected: Only see final response, no thinking traces');
    console.log('─'.repeat(40));
    
    const response = await fetch('https://openai-proxy.alexandrite.workers.dev/v1/chat/completions?hide_thinking=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner', // Maps to deepseek-ai/deepseek-r1
        messages: [
          {
            role: "user",
            content: "Write a short story about a mysterious door. Keep it under 100 words."
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        stream: false
      })
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(errorText);
      return;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('✅ Response received:');
    console.log(content);
    console.log(`\n📊 Content length: ${content.length} characters`);
    
    // Check if thinking traces are present
    if (content.includes('<think>') || content.includes('</think>')) {
      console.log('❌ FAIL: Thinking traces still present!');
    } else {
      console.log('✅ SUCCESS: No thinking traces found!');
    }
  };

  // Test without thinking filter
  const testWithoutFilter = async () => {
    console.log('\n🎯 TEST 2: WITHOUT thinking filter (normal mode)');
    console.log('Expected: See thinking traces + final response');
    console.log('─'.repeat(40));
    
    const response = await fetch('https://openai-proxy.alexandrite.workers.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner', // Maps to deepseek-ai/deepseek-r1
        messages: [
          {
            role: "user",
            content: "Write a short story about a magical book. Keep it under 100 words."
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      })
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(errorText);
      return;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('✅ Response received:');
    console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    console.log(`\n📊 Content length: ${content.length} characters`);
    
    // Check if thinking traces are present
    if (content.includes('<think>') || content.includes('</think>')) {
      console.log('✅ SUCCESS: Thinking traces found (as expected)!');
    } else {
      console.log('⚠️ NOTE: No thinking traces found (model might not have used them)');
    }
  };

  try {
    await testWithFilter();
    await testWithoutFilter();
    
    console.log('\n🎉 Testing complete! Compare the two responses above.');
    console.log('The first should be clean, the second should show thinking.');
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testThinkingFilter();
