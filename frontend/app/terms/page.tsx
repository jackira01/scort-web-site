'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, Users, FileText } from 'lucide-react';

const TermsPage = () => {
  const lastUpdated = "15 de enero de 2024";

  const sections = [
    {
      id: "acceptance",
      title: "1. Aceptación de los Términos",
      icon: <FileText className="h-5 w-5" />,
      content: [
        "Al acceder y utilizar nuestros servicios, usted acepta estar sujeto a estos Términos y Condiciones de uso, todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de cualquier ley local aplicable.",
        "Si no está de acuerdo con alguno de estos términos, tiene prohibido usar o acceder a este sitio. Los materiales contenidos en este sitio web están protegidos por las leyes de derechos de autor y marcas comerciales aplicables."
      ]
    },
    {
      id: "services",
      title: "2. Descripción de los Servicios",
      icon: <Users className="h-5 w-5" />,
      content: [
        "Nuestra plataforma proporciona servicios de conexión social y entretenimiento para adultos mayores de 18 años. Los usuarios pueden crear perfiles, interactuar con otros usuarios y acceder a contenido premium mediante planes de suscripción.",
        "Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de nuestros servicios en cualquier momento, con o sin previo aviso.",
        "Los servicios están disponibles únicamente para personas que tengan la capacidad legal para celebrar contratos vinculantes según la ley aplicable."
      ]
    },
    {
      id: "user-accounts",
      title: "3. Cuentas de Usuario",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "Para acceder a ciertas funciones de nuestros servicios, debe crear una cuenta proporcionando información precisa, actual y completa según se solicite en nuestro formulario de registro.",
        "Usted es responsable de mantener la confidencialidad de su contraseña y cuenta, y es totalmente responsable de todas las actividades que ocurran bajo su contraseña o cuenta.",
        "Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su contraseña o cuenta o cualquier otra violación de seguridad.",
        "No puede usar como nombre de usuario el nombre de otra persona o entidad o que no esté legalmente disponible para su uso, un nombre o marca comercial que esté sujeto a derechos de otra persona o entidad que no sea usted."
      ]
    },
    {
      id: "content-policy",
      title: "4. Política de Contenido",
      icon: <FileText className="h-5 w-5" />,
      content: [
        "Los usuarios son responsables de todo el contenido que publican, cargan o comparten a través de nuestros servicios. El contenido debe cumplir con nuestras pautas comunitarias y no debe ser ilegal, ofensivo, difamatorio o que infrinja los derechos de terceros.",
        "Nos reservamos el derecho de revisar, editar o eliminar cualquier contenido que consideremos inapropiado o que viole estos términos.",
        "Al publicar contenido, otorga a la plataforma una licencia no exclusiva, transferible, sublicenciable, libre de regalías y mundial para usar, copiar, modificar, crear trabajos derivados, distribuir, mostrar públicamente y realizar públicamente dicho contenido.",
        "Está prohibido el contenido que promueva actividades ilegales, violencia, discriminación, acoso o que sea considerado spam."
      ]
    },
    {
      id: "payments",
      title: "5. Pagos y Suscripciones",
      icon: <Calendar className="h-5 w-5" />,
      content: [
        "Algunos de nuestros servicios requieren el pago de tarifas. Todas las tarifas se cobran por adelantado y no son reembolsables, excepto según se establezca expresamente en estos términos.",
        "Las suscripciones se renuevan automáticamente al final de cada período de facturación, a menos que cancele su suscripción antes de la fecha de renovación.",
        "Nos reservamos el derecho de cambiar nuestros precios en cualquier momento. Los cambios de precios entrarán en vigor al comienzo de su próximo período de facturación.",
        "Es su responsabilidad mantener actualizada la información de pago. Si su método de pago falla, podemos suspender o cancelar su acceso a los servicios premium."
      ]
    },
    {
      id: "privacy",
      title: "6. Privacidad y Protección de Datos",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "Su privacidad es importante para nosotros. Nuestra Política de Privacidad explica cómo recopilamos, usamos y protegemos su información cuando utiliza nuestros servicios.",
        "Al usar nuestros servicios, acepta la recopilación y el uso de información de acuerdo con nuestra Política de Privacidad.",
        "Implementamos medidas de seguridad apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.",
        "No vendemos, comercializamos o transferimos de otra manera a terceros su información de identificación personal sin su consentimiento, excepto según se describe en nuestra Política de Privacidad."
      ]
    },
    {
      id: "prohibited-uses",
      title: "7. Usos Prohibidos",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "No puede usar nuestros servicios para ningún propósito ilegal o no autorizado, ni puede, en el uso del servicio, violar ninguna ley en su jurisdicción.",
        "Está prohibido transmitir gusanos, virus o cualquier código de naturaleza destructiva.",
        "No puede usar nuestros servicios para acosar, abusar, insultar, dañar, difamar, calumniar, menospreciar, intimidar o discriminar.",
        "Está prohibido el uso de nuestros servicios para actividades comerciales no autorizadas, spam, o para recopilar información de otros usuarios sin su consentimiento."
      ]
    },
    {
      id: "termination",
      title: "8. Terminación",
      icon: <FileText className="h-5 w-5" />,
      content: [
        "Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso o responsabilidad, por cualquier motivo, incluyendo sin limitación si usted incumple los Términos.",
        "Al terminar, su derecho a usar el servicio cesará inmediatamente. Si desea terminar su cuenta, simplemente puede dejar de usar el servicio.",
        "Todas las disposiciones de los Términos que por su naturaleza deberían sobrevivir a la terminación sobrevivirán a la terminación, incluyendo, sin limitación, disposiciones de propiedad, renuncias de garantía, indemnización y limitaciones de responsabilidad."
      ]
    },
    {
      id: "disclaimer",
      title: "9. Descargo de Responsabilidad",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "La información en este sitio web se proporciona sobre una base 'tal como está'. En la medida máxima permitida por la ley, esta empresa excluye todas las representaciones y garantías relacionadas con este sitio web y su contenido.",
        "En ningún caso esta empresa será responsable de ningún daño especial, indirecto o consecuente o cualquier daño que surja del uso o en conexión con el uso de este sitio web o con el retraso o la imposibilidad de usar el sitio web.",
        "No garantizamos que el servicio será ininterrumpido, oportuno, seguro o libre de errores."
      ]
    },
    {
      id: "changes",
      title: "10. Modificaciones a los Términos",
      icon: <Calendar className="h-5 w-5" />,
      content: [
        "Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos.",
        "Lo que constituye un cambio material será determinado a nuestra sola discreción. Al continuar accediendo o usando nuestro servicio después de que esas revisiones entren en vigor, usted acepta estar sujeto a los términos revisados."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Estos términos rigen el uso de nuestros servicios. Por favor, léelos cuidadosamente.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-gray-600">Última actualización: {lastUpdated}</span>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Aviso Importante</h3>
                <p className="text-gray-700">
                  Al utilizar nuestros servicios, usted acepta estos términos y condiciones en su totalidad. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={section.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {section.icon}
                  </div>
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-2xl text-center">¿Tienes Preguntas?</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700 mb-6">
              Si tienes alguna pregunta sobre estos Términos y Condiciones, no dudes en contactarnos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge variant="outline" className="px-4 py-2">
                Email: legal@empresa.com
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                Teléfono: +57 (1) 234-5678
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Estos términos y condiciones son efectivos a partir del {lastUpdated} y se aplican a todos los usuarios de nuestros servicios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;