import mongoose from 'mongoose';
import { ContentPage } from '../src/modules/content/content.model';
import { CreateContentPageInput, ContentBlockType } from '../src/modules/content/content.types';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

const predefinedPages: CreateContentPageInput[] = [
  {
    slug: 'faq',
    title: 'Preguntas Frecuentes',
    sections: [
      {
        title: 'Información General',
        order: 0,
        blocks: [
          {
            type: ContentBlockType.LIST,
            value: '¿Qué es PREPAGOSVIIP? PREPAGOSVIIP es un portal web que se ha encargado de seleccionar e invitar para su funcionamiento en las principales ciudades de Colombia. Nuestros principales clientes son hombres que cumplen con criterios de verificación, belleza y calidad elevados con el propósito que los usuarios puedan encontrar en un solo lugar las mejores opciones.',
            order: 0
          },
          {
            type: ContentBlockType.LIST,
            value: '¿Qué es un USUARIO? Un USUARIO es toda persona que ingresa a nuestro portal, por ejemplo, en búsqueda de acompañantes. USUARIO REGISTRADO es aquella persona que se inscribe con su correo en PREPAGOSVIIP y mínimo sube su documento de identidad para verificar que es mayor de edad.',
            order: 1
          },
          {
            type: ContentBlockType.LIST,
            value: '¿Qué es un PERFIL? Una vez que el USUARIO REGISTRADO haya sido aprobado puede comenzar a crear sus perfiles. El PERFIL es el micrositio con la descripción del escort, escort gay, trans, gigolo, masajista o virtual que los visitantes podrán ver y contactar a través de WhatsApp, llamada al celular, correo electrónico o portal y contactar vía WhatsApp.',
            order: 2
          },
          {
            type: ContentBlockType.LIST,
            value: '¿Cuántos perfiles puede tener un usuario? Un USUARIO REGISTRADO podría tener hasta 3 perfiles AMATISTA (gratis) y hasta 10 perfiles con planes pagos. No basta con upgrade, debe ser plan pago. Cuando el plan venza, el perfil dejará de ser visible y solo se permitirán los 3 AMATISTA.',
            order: 3
          }
        ]
      },
      {
        title: 'Features',
        order: 1,
        blocks: [
          {
            type: ContentBlockType.LIST,
            value: '¿Cuáles son las CATEGORÍAS disponibles? Para crear un perfil debes escoger una CATEGORÍA: ESCORT, ESCORT GAY, TRANS, GIGOLO (SOLO CHICOS), MASAJISTA.',
            order: 0
          },
          {
            type: ContentBlockType.LIST,
            value: '¿Cuántas categorías puede tener un perfil? Un perfil solo puede tener una ÚNICA categoría. En caso de querer cambiarla, debes crear otro perfil.',
            order: 1
          },
          {
            type: ContentBlockType.LIST,
            value: '¿Cuáles son los PLANES de PREPAGOSVIIP? Los planes son los mismos para todos los usuarios registrados, con los mismos precios y ofrecen rotar DENTRO de su mismo tipo de usuario: DIAMANTE, ORO, ESMERALDA, ZAFIRO.',
            order: 2
          }
        ]
      }
    ],
    modifiedBy: 'system'
  },
  {
    slug: 'terminos',
    title: 'Términos y Condiciones',
    sections: [
      {
        title: 'Términos Generales',
        order: 0,
        blocks: [
          {
            type: ContentBlockType.HEADING,
            value: 'Aceptación de los Términos',
            order: 0
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro sitio web.',
            order: 1
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Modificaciones',
            order: 2
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web. Es su responsabilidad revisar periódicamente estos términos.',
            order: 3
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Elegibilidad',
            order: 4
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Debe ser mayor de 18 años para utilizar este sitio web. Al utilizar nuestros servicios, declara y garantiza que tiene al menos 18 años de edad y que tiene la capacidad legal para celebrar estos términos.',
            order: 5
          }
        ]
      },
      {
        title: 'Servicios y Uso',
        order: 1,
        blocks: [
          {
            type: ContentBlockType.HEADING,
            value: 'Descripción del Servicio',
            order: 0
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Nuestro sitio web proporciona una plataforma para que adultos mayores de edad publiquen anuncios de servicios de acompañamiento. No somos una agencia de escorts ni proporcionamos servicios de acompañamiento directamente.',
            order: 1
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Responsabilidad del Usuario',
            order: 2
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Los usuarios son completamente responsables del contenido que publican, incluyendo textos, imágenes y videos. Debe asegurarse de que todo el contenido cumple con las leyes locales y nacionales aplicables.',
            order: 3
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Contenido Prohibido',
            order: 4
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Está estrictamente prohibido publicar contenido que sea ilegal, ofensivo, discriminatorio, que involucre menores de edad, que promueva actividades ilegales o que viole los derechos de terceros.',
            order: 5
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Verificación de Identidad',
            order: 6
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Nos reservamos el derecho de solicitar verificación de identidad para garantizar la autenticidad de los perfiles. La verificación puede incluir documentos de identidad válidos y fotografías de verificación.',
            order: 7
          }
        ]
      },
      {
        title: 'Privacidad y Datos',
        order: 2,
        blocks: [
          {
            type: ContentBlockType.HEADING,
            value: 'Recopilación de Datos',
            order: 0
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Recopilamos información personal necesaria para proporcionar nuestros servicios, incluyendo nombre, edad, ubicación, información de contacto y contenido multimedia que usted elija compartir.',
            order: 1
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Uso de la Información',
            order: 2
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Utilizamos su información para operar la plataforma, procesar pagos, proporcionar soporte al cliente, mejorar nuestros servicios y cumplir con obligaciones legales.',
            order: 3
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Compartir Información',
            order: 4
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'No vendemos, alquilamos ni compartimos su información personal con terceros, excepto cuando sea necesario para operar la plataforma o cuando lo requiera la ley.',
            order: 5
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Seguridad de Datos',
            order: 6
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.',
            order: 7
          }
        ]
      },
      {
        title: 'Pagos y Facturación',
        order: 3,
        blocks: [
          {
            type: ContentBlockType.HEADING,
            value: 'Tarifas del Servicio',
            order: 0
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Las tarifas por nuestros servicios se muestran claramente en la página de precios. Todos los precios están en pesos colombianos (COP) e incluyen los impuestos aplicables.',
            order: 1
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Métodos de Pago',
            order: 2
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Aceptamos varios métodos de pago incluyendo tarjetas de crédito, débito, transferencias bancarias y billeteras digitales. Todos los pagos se procesan de forma segura a través de proveedores de pago certificados.',
            order: 3
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Política de Reembolsos',
            order: 4
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Los reembolsos se considerarán caso por caso. Generalmente, los servicios digitales no son reembolsables una vez que han sido utilizados o activados.',
            order: 5
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Facturación Automática',
            order: 6
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Para suscripciones recurrentes, su método de pago será cargado automáticamente en cada período de facturación hasta que cancele su suscripción.',
            order: 7
          }
        ]
      },
      {
        title: 'Aspectos Legales',
        order: 4,
        blocks: [
          {
            type: ContentBlockType.HEADING,
            value: 'Limitación de Responsabilidad',
            order: 0
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'No seremos responsables por daños directos, indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar nuestros servicios.',
            order: 1
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Indemnización',
            order: 2
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Usted acepta indemnizar y eximir de responsabilidad a la empresa, sus directores, empleados y agentes de cualquier reclamo, pérdida, responsabilidad, daño o gasto que surja de su uso del sitio web.',
            order: 3
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Ley Aplicable',
            order: 4
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Estos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta en los tribunales competentes de Colombia.',
            order: 5
          },
          {
            type: ContentBlockType.HEADING,
            value: 'Terminación',
            order: 6
          },
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso, por cualquier motivo, incluyendo si creemos que ha violado estos términos.',
            order: 7
          }
        ]
      }
    ],
    modifiedBy: 'system'
  },
  {
    slug: 'terminos-new',
    title: 'Términos y Condiciones (Nueva Versión)',
    sections: [
      {
        title: 'Términos Actualizados',
        order: 0,
        blocks: [
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Versión actualizada de nuestros términos y condiciones.',
            order: 0
          }
        ]
      }
    ],
    modifiedBy: 'system'
  },
  {
    slug: 'faq-new',
    title: 'FAQ (Nueva Versión)',
    sections: [
      {
        title: 'Preguntas Frecuentes Actualizadas',
        order: 0,
        blocks: [
          {
            type: ContentBlockType.PARAGRAPH,
            value: 'Versión actualizada de nuestras preguntas frecuentes.',
            order: 0
          }
        ]
      }
    ],
    modifiedBy: 'system'
  }
];

async function createPredefinedContentPages() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('📄 Creando páginas de contenido predefinidas...');

    for (const pageData of predefinedPages) {
      // Verificar si la página ya existe
      const existingPage = await ContentPage.findOne({ slug: pageData.slug });

      if (existingPage) {
        console.log(`⚠️  La página "${pageData.slug}" ya existe, omitiendo...`);
        continue;
      }

      // Crear la nueva página
      const newPage = new ContentPage(pageData);
      await newPage.save();
      console.log(`✅ Página "${pageData.slug}" creada exitosamente`);
    }

    console.log('🎉 Todas las páginas predefinidas han sido procesadas');

  } catch (error) {
    console.error('❌ Error al crear páginas predefinidas:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el script
if (require.main === module) {
  createPredefinedContentPages();
}

export default createPredefinedContentPages;