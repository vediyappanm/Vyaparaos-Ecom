const crypto = require('crypto');
const fs = require('fs');

// Read .env file directly
const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/AMAZON_PAAPI_KEY="([^"]+)"/);
const encodedKey = match ? match[1] : null;

// Decode base64 key
const decodedKey = Buffer.from(encodedKey, 'base64').toString('utf-8');
console.log('Decoded API Key:', decodedKey);

// Parse the key (format: partnerId:apiKey)
const [partnerId, apiKey] = decodedKey.split(':');
console.log('Partner ID:', partnerId);
console.log('API Key:', apiKey ? 'Present' : 'Missing');

// Test configuration for PA-API 5.0
const host = 'webservices.amazon.com';
const region = 'us-east-1';
const endpoint = 'https://webservices.amazon.com/paapi5/searchitems';

// Test request payload
const payload = {
  Keywords: 'laptop',
  SearchIndex: 'All',
  ItemCount: 1,
  Resources: [
    'Images.Primary.Medium',
    'ItemInfo.Title',
    'Offers.Listings.Price'
  ]
};

console.log('\n--- Testing Amazon PA-API 5.0 ---');
console.log('Endpoint:', endpoint);
console.log('Payload:', JSON.stringify(payload, null, 2));

// Note: PA-API 5.0 requires AWS signature v4 signing
// This is a simplified test - you'll need the amazon-paapi5 SDK for full implementation
console.log('\n⚠️  Full API testing requires AWS signature v4 signing.');
console.log('To properly test this API, install the official SDK:');
console.log('  npm install amazon-paapi5');
console.log('\nOr use curl with the decoded key for basic testing.');
