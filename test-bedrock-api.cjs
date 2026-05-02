const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/AMAZON_PAAPI_KEY="([^"]+)"/);
const encodedKey = match ? match[1] : null;

// Decode base64 key
const decodedKey = Buffer.from(encodedKey, 'base64').toString('utf-8');
const [partnerId, apiKey] = decodedKey.split(':');

console.log('Testing Amazon Bedrock API...');
console.log('Partner ID:', partnerId);
console.log('API Key:', apiKey ? 'Present' : 'Missing');

// Create Bedrock client
const client = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: partnerId,
    secretAccessKey: apiKey
  }
});

// Test with Anthropic Claude 3 Haiku (a simple, fast model)
async function testBedrock() {
  try {
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "API test successful" in one sentence.'
          }
        ]
      })
    });

    console.log('\nSending request to Bedrock...');
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('\n✅ API Test Successful!');
    console.log('Response:', responseBody.content[0].text);
    
  } catch (error) {
    console.error('\n❌ API Test Failed!');
    console.error('Error:', error.message);
    if (error.$metadata) {
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
  }
}

testBedrock();
