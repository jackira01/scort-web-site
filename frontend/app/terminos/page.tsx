'use client';

import PublicContentPage from '@/components/public/PublicContentPage';
import {
  AlertTriangle,
  Clock,
  FileText,
  Mail,
  Scale,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    id: 'general',
    title: 'Términos Generales',
    icon: FileText,
    content: [
      {
        subtitle: 'Aceptación de los Términos',
        text: 'Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro sitio web.',
      },
      {
        subtitle: 'Modificaciones',
        text: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web. Es su responsabilidad revisar periódicamente estos términos.',
      },
      {
        subtitle: 'Elegibilidad',
        text: 'Debe ser mayor de 18 años para utilizar este sitio web. Al utilizar nuestros servicios, declara y garantiza que tiene al menos 18 años de edad y que tiene la capacidad legal para celebrar estos términos.',
      },
    ],
  },
  {
    id: 'services',
    title: 'Servicios y Uso',
    icon: Scale,
    content: [
      {
        subtitle: 'Descripción del Servicio',
        text: 'Nuestro sitio web proporciona una plataforma para que adultos mayores de edad publiquen anuncios de servicios de acompañamiento. No somos una agencia de escorts ni proporcionamos servicios de acompañamiento directamente.',
      },
      {
        subtitle: 'Responsabilidad del Usuario',
        text: 'Los usuarios son completamente responsables del contenido que publican, incluyendo textos, imágenes y videos. Debe asegurarse de que todo el contenido cumple con las leyes locales y nacionales aplicables.',
      },
      {
        subtitle: 'Contenido Prohibido',
        text: 'Está estrictamente prohibido publicar contenido que sea ilegal, ofensivo, discriminatorio, que involucre menores de edad, que promueva actividades ilegales o que viole los derechos de terceros.',
      },
      {
        subtitle: 'Verificación de Identidad',
        text: 'Nos reservamos el derecho de solicitar verificación de identidad para garantizar la autenticidad de los perfiles. La verificación puede incluir documentos de identidad válidos y fotografías de verificación.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacidad y Datos',
    icon: Shield,
    content: [
      {
        subtitle: 'Recopilación de Datos',
        text: 'Recopilamos información personal necesaria para proporcionar nuestros servicios, incluyendo nombre, edad, ubicación, información de contacto y contenido multimedia que usted elija compartir.',
      },
      {
        subtitle: 'Uso de la Información',
        text: 'Utilizamos su información para operar la plataforma, procesar pagos, proporcionar soporte al cliente, mejorar nuestros servicios y cumplir con obligaciones legales.',
      },
      {
        subtitle: 'Compartir Información',
        text: 'No vendemos, alquilamos ni compartimos su información personal con terceros, excepto cuando sea necesario para operar la plataforma o cuando lo requiera la ley.',
      },
      {
        subtitle: 'Seguridad de Datos',
        text: 'Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Pagos y Facturación',
    icon: AlertTriangle,
    content: [
      {
        subtitle: 'Tarifas del Servicio',
        text: 'Las tarifas por nuestros servicios se muestran claramente en la página de precios. Todos los precios están en pesos colombianos (COP) e incluyen los impuestos aplicables.',
      },
      {
        subtitle: 'Métodos de Pago',
        text: 'Aceptamos varios métodos de pago incluyendo tarjetas de crédito, débito, transferencias bancarias y billeteras digitales. Todos los pagos se procesan de forma segura a través de proveedores de pago certificados.',
      },
      {
        subtitle: 'Política de Reembolsos',
        text: 'Los reembolsos se considerarán caso por caso. Generalmente, los servicios digitales no son reembolsables una vez que han sido utilizados o activados.',
      },
      {
        subtitle: 'Facturación Automática',
        text: 'Para suscripciones recurrentes, su método de pago será cargado automáticamente en cada período de facturación hasta que cancele su suscripción.',
      },
    ],
  },
  {
    id: 'legal',
    title: 'Aspectos Legales',
    icon: Scale,
    content: [
      {
        subtitle: 'Limitación de Responsabilidad',
        text: 'No seremos responsables por daños directos, indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar nuestros servicios.',
      },
      {
        subtitle: 'Indemnización',
        text: 'Usted acepta indemnizar y eximir de responsabilidad a la empresa, sus directores, empleados y agentes de cualquier reclamo, pérdida, responsabilidad, daño o gasto que surja de su uso del sitio web.',
      },
      {
        subtitle: 'Ley Aplicable',
        text: 'Estos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta en los tribunales competentes de Colombia.',
      },
      {
        subtitle: 'Terminación',
        text: 'Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso, por cualquier motivo, incluyendo si creemos que ha violado estos términos.',
      },
    ],
  },
];

const TermsPageFallback = () => {
  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Términos y Condiciones
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
            Lea cuidadosamente nuestros términos y condiciones antes de utilizar
            nuestros servicios.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Última actualización: 15 de Diciembre, 2024</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2 animate-in slide-in-from-left-4 duration-500">
              <h3 className="font-semibold text-foreground mb-4">Navegación</h3>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 animate-in slide-in-from-left-2 ${activeSection === section.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <section.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{section.title}</span>
                </button>
              ))}

              {/* Contact Card */}
              <Card className="mt-8 bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Mail className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <h4 className="font-semibold text-foreground mb-2">
                    ¿Preguntas legales?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Contáctanos para aclaraciones sobre nuestros términos.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Contactar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`${activeSection === section.id ? 'block' : 'hidden'
                  } animate-in fade-in-50 slide-in-from-right-4 duration-500`}
              >
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                        <section.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        {section.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {section.content.map((item, index) => (
                      <div
                        key={index}
                        className="animate-in fade-in-50 slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <h3 className="text-lg font-semibold text-foreground mb-3 border-l-4 border-purple-500 pl-4">
                          {item.subtitle}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed pl-4">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Footer Notice */}
            <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Aviso Importante
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                      Estos términos y condiciones constituyen un acuerdo legal
                      entre usted y nuestra empresa. Al utilizar nuestros
                      servicios, usted acepta cumplir con todos los términos
                      aquí establecidos. Si tiene alguna pregunta sobre estos
                      términos, por favor contáctenos antes de utilizar nuestros
                      servicios.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TermsPage() {
  return (
    <PublicContentPage
      slug="terminos"
      fallbackContent={<TermsPageFallback />}
      showBackButton={true}
      backButtonText="Volver al inicio"
      backButtonHref="/"
    />
  );
}
