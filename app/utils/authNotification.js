import messaging from '@react-native-firebase/messaging';
import { presentNotification } from './notificationPresenter';

const DAILY_TIPS_TOPIC = 'daily_energy_tips';

export async function showAuthSuccessNotification(isNewAccount = false) {
  try {
    await messaging().subscribeToTopic(DAILY_TIPS_TOPIC);
    console.log(`Subscribed to topic: ${DAILY_TIPS_TOPIC}`);
  } catch (error) {
    console.log('Daily tips subscription error:', error);
  }

  await presentNotification({
    title: 'Welcome to EasyEco ✨',
    body: isNewAccount
      ? 'Your EasyEco account was created successfully.'
      : 'You signed in to your EasyEco account successfully.',
    type: 'auth',
  });
}
