import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.prepagoya.com';

const categories = ['escort', 'gigolo', 'trans', 'escort-gay', 'masajistas'];
const departments = [
    { name: 'antioquia', cities: ['medellin', 'bello', 'envigado'] },
    { name: 'cundinamarca', cities: ['bogota', 'soacha'] },
    { name: 'valle-del-cauca', cities: ['cali', 'palmira'] },
    { name: 'atlantico', cities: ['barranquilla'] },
    { name: 'santander', cities: ['bucaramanga'] },
    { name: 'bolivar', cities: ['cartagena'] },
    { name: 'risaralda', cities: ['pereira'] },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/planes',
        '/contactanos',
        '/faq',
        '/terminos',
        '/politicas',
        '/precios',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    const categoryRoutes = categories.flatMap((category) => {
        // Main category page
        const mainCat = {
            url: `${BASE_URL}/${category}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        };

        // Department/City combinations
        const locoRoutes = departments.flatMap((dept) => {
            // Category + Dept
            const deptRoute = {
                url: `${BASE_URL}/${category}/${dept.name}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };

            // Category + Dept + City
            const cityRoutes = dept.cities.map((city) => ({
                url: `${BASE_URL}/${category}/${dept.name}/${city}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));

            return [deptRoute, ...cityRoutes];
        });

        return [mainCat, ...locoRoutes];
    });

    return [...routes, ...categoryRoutes];
}
