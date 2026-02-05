import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/adminboard/', '/cuenta/', '/api/', '/autenticacion/'],
        },
        sitemap: 'https://www.prepagoya.com/sitemap.xml',
    };
}
