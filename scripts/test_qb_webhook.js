
import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:5000/api/webhooks/quickbooks';

const testTransaction = {
  studentId: "STU001", // Match the seeded student ID
  productType: "weekly", // daily, weekly, monthly
  amount: 25.00,
  transactionId: "QB-TEST-" + Date.now()
};

async function triggerWebhook() {
  console.log(`🚀 Sending test transaction to ${WEBHOOK_URL}...`);
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTransaction)
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Success! Transaction processed.');
      console.log('Details:', data);
      console.log('\nNow check the "Students" page or "Dashboard" to see the updated balance.');
    } else {
      console.error('❌ Failed to process transaction:', data);
    }
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
  }
}

triggerWebhook();
