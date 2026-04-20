delivery_api = '''import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-url.com/api';

const api = axios.create({
baseURL: API_BASE_URL,
timeout: 30000,
headers: {
'Content-Type': 'application/json',
},
});

api.interceptors.request.use(
async (config) => {
const token = await AsyncStorage.getItem('token');
if (token) {
config.headers.Authorization = Bearer ${token};
}
return config;
},
(error) => Promise.reject(error)
);

api.interceptors.response.use(
(response) => response,
async (error) => {
if (error.response?.status === 401) {
await AsyncStorage.removeItem('token');
}
return Promise.reject(error);
}
);

export default api;
'''
