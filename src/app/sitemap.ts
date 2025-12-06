import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.aifa.cloud';

export default function sitemap(): MetadataRoute.Sitemap {
    const currentDate = new Date().toISOString();

    return [
        {
            url: BASE_URL,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/marketing`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/sign-in`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/sign-up`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];
}
