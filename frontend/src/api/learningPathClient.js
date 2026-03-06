import axios from 'axios';
import { API_URLS } from './config';

const learningPathClient = axios.create({
    baseURL: API_URLS.LEARNING_PATH_BACKEND,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default learningPathClient;
