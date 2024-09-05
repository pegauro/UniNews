// hooks/useNews.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { REACT_APP_API_URL } from '@env';
import { useAuth } from '../context/authContext';
import { useAuthCheck } from '../context/authNavigation';

export function useNews() {
    const BASE_URL = REACT_APP_API_URL;
    const { user } = useAuth();
    const { checkAuth } = useAuthCheck();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [savedNewsIds, setSavedNewsIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const fetchNews = async (url: string, universityImage: string, universityId: string) => {
        try {
            const response = await axios.get(`${BASE_URL}/npm/${encodeURIComponent(url)}`);

            if (response.data && response.data.items) {
                return response.data.items.map((item: any) => {
                    const { imageUrl, cleanedDescription } = extractImageFromDescription(item.description);
                    return {
                        ...item,
                        image: imageUrl || universityImage,
                        description: cleanedDescription,
                        link: item.link,
                        universityId,
                    };
                });
            } else {
                console.error('Unexpected response structure or null data:', response.data);
                return [];
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            return [];
        }
    };

    const extractImageFromDescription = (description: string) => {
        const match = description.match(/<img[^>]+src="([^">]+)"/);
        const cleanedDescription = description.replace(/<\/?[^>]+(>|$)/g, '');
        return { imageUrl: match ? match[1] : '', cleanedDescription };
    };

    const handleSaveNews = async (newsItem: any) => {
        if (!user) {
            console.error('User not logged in.');
            return;
        }

        if (!newsItem.link) {
            console.error('News link is missing');
            return;
        }

        const newsData = {
            link: newsItem.link,
            title: newsItem.title || '',
            description: newsItem.description || '',
            image: newsItem.image || '',
            author: newsItem.author || '',
            published: newsItem.published || new Date(),
            created: newsItem.created || new Date(),
            category: newsItem.category || [],
            enclosures: newsItem.enclosures || [],
            media: newsItem.media || {}
        };

        try {
            const response = await axios.post(`${BASE_URL}/save-news`, {
                userId: user.id,
                news: newsData
            });

            if (response.status === 200) {
                console.log('News saved successfully.');
            } else {
                console.error('Error saving news:', response.data);
            }
        } catch (error) {
            console.error('Error saving news:', error);
        }
    };

    const handleRemoveNews = async (newsItem: any) => {
        if (!user) {
            console.error('User not logged in.');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/remove-news`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    newsUrl: newsItem.link,
                }),
            });

            if (response.ok) {
                console.log('News removed successfully.');
            } else {
                const errorData = await response.json();
                console.error('Error removing news:', errorData.error);
            }
        } catch (error) {
            console.error('Error removing news:', error);
        }
    };

    return {
        news,
        loading,
        savedNewsIds,
        fetchNews,
        handleSaveNews,
        handleRemoveNews,
    };
}
