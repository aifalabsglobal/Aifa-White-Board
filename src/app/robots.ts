import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/board/', '/workspaces/', '/flipbook/'],
            },
        ],
        sitemap: 'https://www.aifa.cloud/sitemap.xml',
    };
}
