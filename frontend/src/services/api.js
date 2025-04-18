import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const getItems = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.search) queryParams.append('search', filters.search);
    
    const response = await axios.get(`${API_URL}/api/items?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};