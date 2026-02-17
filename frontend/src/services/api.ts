import axios from 'axios';

// Replace with your actual backend URL when running locally or in prod
const API_URL = 'http://localhost:8000';
const USE_MOCK = true; // Toggle this to false to use real API

export const api = {
    detectProducts: async (imageUri: string): Promise<any[]> => {
        if (USE_MOCK) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            return [
                { id: '1', name: 'Томаты', confidence: 0.95 },
                { id: '2', name: 'Сыр', confidence: 0.88 },
                { id: '3', name: 'Базилик', confidence: 0.75 },
            ];
        }

        // Real API implementation
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
        } as any);

        const response = await axios.post(`${API_URL}/detect-products`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    generateRecipes: async (products: string[]): Promise<any[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return [
                {
                    id: '1',
                    name: 'Салат Капрезе',
                    time: '10 мин',
                    difficulty: 'Легко',
                    ingredients: ['Томаты', 'Сыр', 'Базилик', 'Оливковое масло'],
                    missingIngredients: ['Оливковое масло'],
                    image: 'https://images.unsplash.com/photo-1529312266912-b33cf6227e24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                },
                {
                    id: '2',
                    name: 'Паста с томатами',
                    time: '25 мин',
                    difficulty: 'Средне',
                    ingredients: ['Паста', 'Томаты', 'Сыр', 'Чеснок'],
                    missingIngredients: ['Паста', 'Чеснок'],
                    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                }
            ];
        }

        // Real API implementation
        const response = await axios.post(`${API_URL}/generate-recipes`, { products });
        return response.data;
    }
};
