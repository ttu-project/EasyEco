const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendDailyGreeting() {
  const message = {
    notification: {
      title: "မင်္ဂလာပါရှင် 😊",
      body: "ဒီနေ့ရော နေကောင်းရဲ့လားခင်ဗျာ။ စိတ်ရွှင်လန်းချမ်းမြေ့ပါစေနော်။",
    },
    topic: 'all_users' 
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('လူတိုင်းဆီ Notification အောင်မြင်စွာ ပို့ပြီးပါပြီ။ Response:', response);
  } catch (error) {
    console.error('Notification ပို့ရတာ အဆင်မပြေပါဘူး။ Error:', error);
  }
}

sendDailyGreeting();