import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export async function askMeterAI(message) {
  const response = await axios.post(`${API_BASE_URL}/ai/ask-meter`, {
    message,
  });

  return response.data.answer;
}
