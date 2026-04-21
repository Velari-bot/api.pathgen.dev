import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const form = new FormData();
form.append('replay', fs.createReadStream('UnsavedReplay-2026.04.18-16.23.55.replay'));

try {
  const res = await axios.post('http://localhost:3000/v1/replay/parse', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': 'Bearer dev-token'
    }
  });
  console.log('--- FINAL API RESPONSE ---');
  console.log(JSON.stringify(res.data.data.ai_coach, null, 2));
} catch (e) {
  console.error('API Error:', e.response?.data || e.message);
}
