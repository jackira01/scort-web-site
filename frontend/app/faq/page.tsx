'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Search, 
  HelpCircle, 
  CreditCard, 
  Shield, 
  Users, 
  Settings, 
  MessageCircle,
  Star,
  Clock,
  Mail,
  Zap,
  Globe,
  UserCheck
} from 'lucide-react';

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
      { id: 'all', name: 'Todas', icon: <HelpCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
      { id: 'account', name: 'Acerca de PREPAGOSVIP', icon: <Users className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
      { id: 'features', name: 'Planes y Ventajas', icon: <Star className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
      { id: 'privacy', name: 'Verificación', icon: <Shield className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
      { id: 'support', name: 'Soporte', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' }
    ];

  const faqs = [
    {
      id: 1,
      category: 'account',
      question: '¿Qué es PREPAGOSVIP?',
      answer: 'PREPAGOSVIP es un portal web que se ha encargado de seleccionar e invitar para su lanzamiento a un grupo de acompañantes, inicialmente en las principales ciudades de Colombia, que consideramos cumplen con criterios de verificación, belleza y calidad elevados con el propósito que los usuarios puedan encontrar en un solo lugar a lo mejor de lo mejor.',
      popular: true
    },
    {
      id: 2,
      category: 'account',
      question: '¿Qué es un USUARIO?',
      answer: 'Un USUARIO es toda persona que ingresa a nuestro portal, por ejemplo, en búsqueda de acompañantes. USUARIO REGISTRADO es aquella persona que se inscribe con su correo en PREPAGOSVIP y mínimo sube su documento de identidad y una foto con su documento para verificar que es mayor de edad.'
    },
    {
      id: 3,
      category: 'account',
      question: '¿Qué es un PERFIL?',
      answer: 'Una vez que el USUARIO REGISTRADO haya sido aprobado puede comenzar a crear sus perfiles. El PERFIL es el micrositio con la descripción del escort, escort gay, trans, gigoló, masajista o virtual que los visitantes podrán visualizar en las diferentes secciones del portal y contactar vía WhatsApp.'
    },
    {
      id: 4,
      category: 'account',
      question: '¿Cuántos perfiles puede tener un usuario?',
      answer: 'Un USUARIO REGISTRADO podrá tener hasta 3 perfiles AMATISTA (gratis) y hasta 10 perfiles con planes pagos. No basta con upgrade, debe ser plan pago. Cuando el plan venza, el perfil dejará de ser visible y solo se permitirán los 3 AMATISTA.',
      popular: true
    },
    {
      id: 5,
      category: 'features',
      question: '¿Cuáles son las CATEGORIAS disponibles?',
      answer: 'Para crear un perfil debes escoger una CATEGORIA, es decir el tipo de servicio principal que prestas. En PREPAGOSVIP tenemos: ESCORT (Mujeres acompañantes), ESCORT GAY (Hombres acompañantes para hombres), TRANS (Personas trans), GIGOLÓ (Hombres acompañantes para mujeres), VIRTUAL (Servicios virtuales), IA (Contenido generado por inteligencia artificial).'
    },
    {
      id: 6,
      category: 'features',
      question: '¿Cuántas categorías puede tener un perfil?',
      answer: 'Un perfil solo puede tener una UNICA categoría. En caso de querer visualizarte en otras categorías debes crear otro perfil.'
    },
    {
      id: 7,
      category: 'privacy',
      question: '¿Qué documentación se requiere para cada perfil?',
      answer: 'Para cada perfil se pedirá foto de documento de identidad y foto de rostro con el documento de identidad y un cartel con el nombre y fecha de la solicitud de inscripción registrada en el sistema como mínima verificación.',
      popular: true
    },
    {
      id: 8,
      category: 'privacy',
      question: '¿Cómo garantizan la calidad de los perfiles?',
      answer: 'Todos los acompañantes pasan por un proceso de verificación riguroso donde evaluamos criterios de verificación, belleza y calidad elevados. Iremos verificando a tod@s l@s acompañantes para que cumplan con los estándares necesarios.'
    },
    {
      id: 9,
      category: 'features',
      question: '¿Cuáles son los PLANES de PREPAGOSVIP?',
      answer: 'Los planes son los mismos para todos los tipos de usuarios registrados, con los mismos precios y ofrecen rotar DENTRO de su mismo tipo de usuario: DIAMANTE (Nivel 1): Apareces en el Home, sección SPONSORED, con DESTACADO e IMPULSO por 30 días. ORO (Nivel 2): Apareces en HOME y SPONSORED con DESTACADO, para 7, 15 o 30 días. ESMERALDA (Nivel 3): Apareces en SPONSORED, tercer nivel, puedes ascender 24h con upgrades, para 7, 15 o 30 días. ZAFIRO (Nivel 4): Apareces en HOME, cuarto nivel, puedes ascender 24h con upgrades, para 7, 15 o 30 días. AMATISTA (Nivel 5): Plan Gratuito, apareces en resultados después de planes pagos, puedes ascender 24h con upgrades, 180 días por defecto.',
      popular: true
    },
    {
      id: 10,
      category: 'features',
      question: '¿Cuáles son las UPGRADES de PREPAGOSVIP?',
      answer: 'Como varios escorts pueden escoger el mismo plan, sus perfiles rotan dentro de su nivel. Para subir de nivel o regresar a primeros lugares puedes adquirir UPGRADES: DESTACADO: Apareces con recuadro alrededor del perfil y subes un nivel por 24 horas (ej: AMATISTA asciende a ZAFIRO). Si tienes plan DIAMANTE viene por defecto. IMPULSO: Si ya estás destacado pero bajando por rotación, te devuelve a primeros lugares del nivel por 24 horas. Requiere haber comprado primero DESTACADO.',
      popular: true
    },
    {
      id: 11,
      category: 'features',
      question: '¿Qué son NIVELES y PRIORIDADES?',
      answer: 'Los niveles son: DIAMANTE (Nivel 1), ORO (Nivel 2), ESMERALDA (Nivel 3), ZAFIRO (Nivel 4), AMATISTA (Nivel 5). La PRIORIDAD dentro del nivel la da la duración del plan o si vienes ascendido por DESTACADO o DESTACADO más IMPULSO.'
    },
    {
      id: 12,
      category: 'features',
      question: '¿Me puedes dar ejemplos de cómo funcionan las PRIORIDADES?',
      answer: 'Todos los que adquieren plan ORO tienen nivel 2, pero la prioridad será mayor para ORO de 30 días vs uno de 15 días. Si eres ESMERALDA de 30 días y compras DESTACADO, subes a nivel ORO con prioridad de ORO de 7 días por 24 horas. Si después compras IMPULSO, subes a prioridad de ORO de 15 días por 24 horas.'
    },
    {
      id: 13,
      category: 'features',
      question: '¿Aplica el derecho de RETRACTO EN COMPRA ONLINE?',
      answer: 'El derecho de retracto (Ley 1480 de 2011, artículo 47) permite arrepentirse de compras a distancia, pero tiene excepciones para servicios cuya prestación haya comenzado con acuerdo del consumidor. El plan se activa al momento de aprobación escrita, antes del pago. El usuario acepta que "Una vez activado el plan no aplica retracto". Si desea retractarse, devolvemos el dinero SIEMPRE Y CUANDO haya ingresado a nuestras cuentas (para evitar fraudes).'
    },
    {
      id: 14,
      category: 'features',
      question: '¿Cuáles son las ventajas de inscribirse con PREPAGOSVIP?',
      answer: 'En nuestra etapa de lanzamiento vas a tener menos competencia dentro de nuestro mismo portal y por ende mayor visibilidad a menor precio, comparado con portales actuales. A diferencia de otros portales, nosotros estamos invirtiendo en publicidad para aparecer en los principales motores de búsqueda por palabras clave, todo para que tu perfil tenga mayor visibilidad.'
    },
    {
      id: 15,
      category: 'features',
      question: '¿Qué optimizaciones realizan para mejorar la visibilidad?',
      answer: 'Hacemos optimizaciones internas de programación y de SEO para que nuestro portal sea mejor rankeado en buscadores tales como Google. Tenemos diferentes planes y paquetes para que puedas escoger el que mas te convenga, bien sea por tu flujo de caja, por los tiempos en los que trabajas, las temporadas, si quieres tener presencia de manera constante pero poder mostrarte más algunos días que tu escojas, mostrarte en diferentes partes del portal, etc.'
    },
    {
      id: 16,
      category: 'features',
      question: '¿Cómo funciona el sistema de posicionamiento de perfiles?',
      answer: 'En los demás portales tu perfil rota constantemente e incluso puedes llegar a quedar en últimas posiciones de visualización. Con nosotros tienes diferentes opciones para que tu perfil: Se muestre en diferentes secciones del portal y con diseños para destacar tu perfil, Rote dentro de un mismo nivel sin caer a los últimos puestos totales, Suba de nivel por 24 horas al comprar el upgrade DESTACADO, Si estas bajando en el posicionamiento dentro de tu nivel, tienes una opción adicional para regresar a los primeros lugares de visualización dentro de tu nivel con el upgrade IMPULSO.',
      popular: true
    },
    {
      id: 17,
      category: 'features',
      question: '¿Cuál es la ventaja de buscar acompañantes en PREPAGOSVIP?',
      answer: 'Usamos verificaciones y cada vez vamos a ser mas exigentes con esto, para que puedas estar tranquilo a la hora de contratar tu acompañante. Tenemos diferentes filtros para que puedas encontrar mas rápidamente el tipo de acompañante o prepago que tienes en mente. Constantemente estamos en la búsqueda de las mejores escorts, las transexuales mas bellas, los mejores gigolos para que cada vez tengas mejores opciones.'
    },
    {
      id: 18,
      category: 'features',
      question: '¿Qué herramientas adicionales están desarrollando?',
      answer: 'Estamos trabajando en diferentes formas en las que puedas monetizar tu contenido o tus servicios o para que puedas tener mayor visibilidad dentro y fuera de nuestro portal. Estas herramientas te serán comunicadas de manera interna.'
    },
    {
      id: 19,
      category: 'support',
      question: '¿Cuál es la misión de PREPAGOSVIP?',
      answer: 'Nuestra misión es publicar las principales características de nuestr@s afiliad@s para que el usuario final pueda tomar una decisión documentada, sin embargo, aclaramos que l@s acompañantes no trabajan para nosotros, ni somos responsables en manera alguna por su contratación o pagos.',
      popular: true
    },
    {
      id: 20,
      category: 'support',
      question: '¿Qué verificación se requiere para perfiles IA?',
      answer: 'Para la categoría IA, el USUARIO REGISTRADO igualmente debe verificar que es mayor de edad, con la foto y documentación del creador de contenido, pero sus perfiles no lo necesitarán.'
    },
    {
      id: 21,
      category: 'support',
      question: '¿Qué requisitos hay para los usuarios registrados?',
      answer: 'Inicialmente solo tendremos usuarios inscritos con el fin de crear perfiles, posteriormente abriremos la opción de crear usuarios que puedan comentar los perfiles y realizar otras acciones. Solo hasta que el usuario cumpla con la verificación de mayoría de edad podrá crear perfiles.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularFAQs = faqs.filter(faq => faq.popular);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Encuentra respuestas rápidas a las preguntas más comunes sobre PREPAGOSVIP y nuestros servicios.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar en las preguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
        </div>

        {/* Popular Questions */}
        {searchTerm === '' && selectedCategory === 'all' && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Preguntas Más Populares</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {popularFAQs.map((faq) => {
                  const category = categories.find(cat => cat.id === faq.category);
                  return (
                    <div key={faq.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Badge className={`${category?.color} flex-shrink-0 w-fit`}>
                          {category?.name}
                        </Badge>
                        <span className="font-medium text-gray-900 text-sm sm:text-base break-words">{faq.question}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-shrink-0 w-full sm:w-auto"
                        onClick={() => {
                          setSelectedCategory(faq.category);
                          document.getElementById(`faq-${faq.id}`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Ver respuesta
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filters */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtrar por categoría:</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                {category.icon}
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {category.id === 'all' ? faqs.length : faqs.filter(faq => faq.category === category.id).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preguntas y Respuestas</span>
              <Badge variant="outline">
                {filteredFAQs.length} resultado{filteredFAQs.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq) => {
                  const category = categories.find(cat => cat.id === faq.category);
                  return (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`} id={`faq-${faq.id}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-center space-x-3">
                          <Badge className={category?.color}>
                            {category?.name}
                          </Badge>
                          <span className="font-medium">{faq.question}</span>
                          {faq.popular && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 pb-2">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-600 mb-4">
                  No encontramos preguntas que coincidan con tu búsqueda.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
              <MessageCircle className="h-6 w-6" />
              <span>¿No encontraste lo que buscabas?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700 mb-6">
              Nuestro equipo de soporte está aquí para ayudarte con cualquier pregunta adicional.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Chat en Vivo</h4>
                <p className="text-sm text-gray-600 mb-3">Disponible 24/7</p>
                <Button size="sm" className="w-full">
                  Iniciar Chat
                </Button>
              </Card>
              
              <Card className="p-4">
                <Mail className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Email</h4>
                <p className="text-sm text-gray-600 mb-3">Respuesta en 24h</p>
                <Button size="sm" variant="outline" className="w-full">
                  Enviar Email
                </Button>
              </Card>
              
              <Card className="p-4">
                <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Centro de Ayuda</h4>
                <p className="text-sm text-gray-600 mb-3">Guías detalladas</p>
                <Button size="sm" variant="outline" className="w-full">
                  Ver Guías
                </Button>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;
