'use client';

import Link from 'next/link';

interface Keyword {
    text: string;
    url: string;
}

const keywords: Keyword[] = [
    { text: 'PREPAGOS BOGOTÁ', url: '/escort/cundinamarca/bogota' },
    { text: 'PREPAGOS MEDELLÍN', url: '/escort/antioquia/medellin' },
    { text: 'PREPAGOS CALI', url: '/escort/valle-del-cauca/cali' },
    { text: 'PREPAGOS BARRANQUILLA', url: '/escort/atlantico/barranquilla' },
    { text: 'PREPAGOS BUCARAMANGA', url: '/escort/santander/bucaramanga' },
    { text: 'SCORT BOGOTÁ', url: '/escort/cundinamarca/bogota' },
    { text: 'SCORT MEDELLÍN', url: '/escort/antioquia/medellin' },
    { text: 'SCORT CALI', url: '/escort/valle-del-cauca/cali' },
    { text: 'SCORT BARRANQUILLA', url: '/escort/atlantico/barranquilla' },
    { text: 'SCORT BUCARAMANGA', url: '/escort/santander/bucaramanga' },
    { text: 'TRANS BOGOTÁ', url: '/trans/cundinamarca/bogota' },
    { text: 'TRANS MEDELLÍN', url: '/trans/antioquia/medellin' },
    { text: 'TRANS CALI', url: '/trans/valle-del-cauca/cali' },
    { text: 'PUTAS MEDELLÍN', url: '/escort/antioquia/medellin' },
    { text: 'PUTAS BOGOTÁ', url: '/escort/cundinamarca/bogota' },
    { text: 'PUTAS CALI', url: '/escort/valle-del-cauca/cali' },
    { text: 'PUTAS BARRANQUILLA', url: '/escort/atlantico/barranquilla' },
    { text: 'PUTAS BUCARAMANGA', url: '/escort/santander/bucaramanga' },
    { text: 'TRAVESTIS BOGOTÁ', url: '/trans/cundinamarca/bogota' },
    { text: 'TRAVESTIS MEDELLÍN', url: '/trans/antioquia/medellin' },
    { text: 'TRAVESTIS CALI', url: '/trans/valle-del-cauca/cali' },
    { text: 'GIGOLO BOGOTÁ', url: '/gigolo/cundinamarca/bogota' },
    { text: 'GIGOLO MEDELLÍN', url: '/gigolo/antioquia/medellin' },
    { text: 'GIGOLO CALI', url: '/gigolo/valle-del-cauca/cali' },
    { text: 'SCORT GAY BOGOTÁ', url: '/escort-gay/cundinamarca/bogota' },
    { text: 'SCORT GAY MEDELLÍN', url: '/escort-gay/antioquia/medellin' },
    { text: 'SEXO EN BOGOTÁ', url: '/escort/cundinamarca/bogota' },
    { text: 'ENCUENTROS SEXO CALI', url: '/escort/valle-del-cauca/cali' },
    { text: 'PUTAS PEREIRA', url: '/escort/risaralda/pereira' },
    { text: 'PUTAS CARTAGENA', url: '/escort/bolivar/cartagena' },
    { text: 'PREPAGOS PEREIRA', url: '/escort/risaralda/pereira' },
    { text: 'PREPAGOS CARTAGENA', url: '/escort/bolivar/cartagena' },
    { text: 'MASAJISTAS BOGOTÁ', url: '/masajistas/cundinamarca/bogota' },
    { text: 'MASAJISTAS MEDELLÍN', url: '/masajistas/antioquia/medellin' },
];

const ExploreKeywords = () => {
    const generateTitleFromUrl = (url: string) => {
        try {
            const parts = url.split('/').filter(Boolean);
            const formatPart = (str: string) =>
                str.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

            if (parts.length === 3) {
                const [category, department, city] = parts;
                return `${formatPart(category)} en ${formatPart(city)}, ${formatPart(department)}`;
            } else if (parts.length === 2) {
                const [category, department] = parts;
                return `${formatPart(category)} en ${formatPart(department)}`;
            }
            return parts.map(formatPart).join(' ');
        } catch (error) {
            return '';
        }
    };

    return (
        <section className="w-full bg-gray-50 dark:bg-gray-900/30 py-12 mt-12 transition-colors duration-500">
            <div className="lg:container lg:mx-auto md:px-0 md:mx-0 md:w-full px-4">
                <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Explora más opciones
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base max-w-2xl mx-auto">
                        Explora términos frecuentes que te ayudarán a encontrar perfiles más rápido.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {keywords.map((keyword, index) => (
                            <Link
                                key={index}
                                href={keyword.url}
                                title={generateTitleFromUrl(keyword.url)}
                                className="group inline-flex items-center justify-center px-4 py-2.5 
                         bg-white dark:bg-gray-800 
                         border border-gray-200 dark:border-gray-700 
                         rounded-full text-sm font-medium 
                         text-gray-700 dark:text-gray-300 
                         hover:border-pink-400 hover:text-pink-600 
                         dark:hover:border-pink-500 dark:hover:text-pink-400
                         hover:shadow-sm
                         transition-all duration-200 
                         text-center"
                            >
                                {keyword.text}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ExploreKeywords;
