const readline = require('readline');

// Configuration
const PROXY_URL = 'https://proxy.alexandrite.workers.dev/v1/chat/completions';
// Define your NVIDIA API key here (get it from build.nvidia.com)
const API_KEY = 'YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
let MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'; // Correct model name

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Function to send message to your proxy
async function sendMessage(message) {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  };

  try {
    console.log(`${colors.yellow}🤖 Sending to ${MODEL}...${colors.reset}`);
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;
      console.log(`${colors.green}🤖 AI Response:${colors.reset}`);
      console.log(aiResponse);
      
      // Show usage stats if available
      if (data.usage) {
        console.log(`${colors.cyan}📊 Tokens: ${data.usage.prompt_tokens} prompt + ${data.usage.completion_tokens} completion = ${data.usage.total_tokens} total${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}❌ Unexpected response format:${colors.reset}`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Function to start the chat
function startChat() {
  console.log(`${colors.bright}${colors.blue}🚀 NVIDIA NIM Proxy Chat Tester${colors.reset}`);
  console.log(`${colors.cyan}📡 Proxy URL: ${PROXY_URL}${colors.reset}`);
  console.log(`${colors.cyan}🤖 Model: ${MODEL}${colors.reset}`);
  console.log(`${colors.yellow}💡 Type 'quit' or 'exit' to stop${colors.reset}`);
  console.log(`${colors.yellow}💡 Type 'model <name>' to change model${colors.reset}`);
  console.log('─'.repeat(60));
  
  askQuestion();
}

// Function to ask for user input
function askQuestion() {
  rl.question(`${colors.green}💬 You: ${colors.reset}`, async (input) => {
    const trimmed = input.trim();
    
    if (trimmed === 'quit' || trimmed === 'exit') {
      console.log(`${colors.yellow}👋 Goodbye!${colors.reset}`);
      rl.close();
      return;
    }
    
    if (trimmed.startsWith('model ')) {
      const newModel = trimmed.substring(6).trim();
      if (newModel) {
        MODEL = newModel;
        console.log(`${colors.cyan}✅ Model changed to: ${MODEL}${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Please specify a model name${colors.reset}`);
      }
      askQuestion();
      return;
    }
    
    if (trimmed === '') {
      askQuestion();
      return;
    }
    
    await sendMessage(trimmed);
    console.log('─'.repeat(60));
    askQuestion();
  });
}

// Check if API key is set
if (API_KEY === 'nvapi-YOUR-API-KEY-HERE') {
  console.log(`${colors.red}❌ Please set your API key in the script!${colors.reset}`);
  console.log(`${colors.yellow}📝 Edit line 4 and replace 'nvapi-YOUR-API-KEY-HERE' with your actual API key${colors.reset}`);
  process.exit(1);
}

// Start the chat
startChat();
