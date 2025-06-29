"use client"

import { useState } from "react"
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

const faqCategories = [
  {
    id: "general",
    title: "Preguntas Generales",
    icon: HelpCircle,
    questions: [
      {
        id: 1,
        question: "¿Qué es Online Escorts?",
        answer:
          "Online Escorts es una plataforma digital que conecta a profesionales del acompañamiento con clientes potenciales. Proporcionamos un espacio seguro y profesional para que los usuarios publiquen sus perfiles y servicios.",
      },
      {
        id: 2,
        question: "¿Es legal utilizar esta plataforma?",
        answer:
          "Sí, nuestra plataforma opera dentro del marco legal aplicable. Todos nuestros usuarios deben ser mayores de 18 años y cumplir con las leyes locales y nacionales. No facilitamos actividades ilegales.",
      },
      {
        id: 3,
        question: "¿Cómo garantizan la seguridad de los usuarios?",
        answer:
          "Implementamos múltiples medidas de seguridad incluyendo verificación de identidad, moderación de contenido, sistemas de reporte, y protección de datos personales. También proporcionamos consejos de seguridad a nuestros usuarios.",
      },
      {
        id: 4,
        question: "¿Puedo usar la plataforma de forma anónima?",
        answer:
          "Aunque respetamos la privacidad, requerimos cierta información para verificación y seguridad. Puedes controlar qué información es visible públicamente en tu perfil.",
      },
    ],
  },
  {
    id: "account",
    title: "Cuenta y Perfil",
    icon: MessageCircle,
    questions: [
      {
        id: 5,
        question: "¿Cómo creo una cuenta?",
        answer:
          "Para crear una cuenta, haz clic en 'Registrarse', completa el formulario con tu información básica, verifica tu email y sigue los pasos para configurar tu perfil. El proceso toma aproximadamente 10-15 minutos.",
      },
      {
        id: 6,
        question: "¿Qué información necesito para verificar mi perfil?",
        answer:
          "Para la verificación necesitas: documento de identidad válido, foto de verificación (selfie con documento), y completar el formulario de verificación. Este proceso puede tomar 24-48 horas.",
      },
      {
        id: 7,
        question: "¿Puedo tener múltiples perfiles?",
        answer:
          "Sí, puedes crear múltiples perfiles bajo una misma cuenta, especialmente útil para agencias. Cada perfil debe ser verificado individualmente y cumplir con nuestras políticas.",
      },
      {
        id: 8,
        question: "¿Cómo edito mi perfil?",
        answer:
          "Ve a tu dashboard, selecciona 'Mi Perfil', y haz clic en 'Editar'. Puedes modificar tu descripción, fotos, servicios, tarifas y disponibilidad en cualquier momento.",
      },
      {
        id: 9,
        question: "¿Qué hago si olvido mi contraseña?",
        answer:
          "En la página de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?', ingresa tu email y recibirás un enlace para restablecer tu contraseña.",
      },
    ],
  },
  {
    id: "payments",
    title: "Pagos y Facturación",
    icon: Mail,
    questions: [
      {
        id: 10,
        question: "¿Cuáles son los métodos de pago aceptados?",
        answer:
          "Aceptamos tarjetas de crédito y débito (Visa, Mastercard), transferencias bancarias, PSE, Nequi, Daviplata y otros métodos de pago digitales populares en Colombia.",
      },
      {
        id: 11,
        question: "¿Cuándo se cobra mi suscripción?",
        answer:
          "Las suscripciones se cobran al momento de la activación y luego automáticamente en cada período de renovación (mensual o anual) hasta que canceles tu suscripción.",
      },
      {
        id: 12,
        question: "¿Puedo cancelar mi suscripción en cualquier momento?",
        answer:
          "Sí, puedes cancelar tu suscripción en cualquier momento desde tu dashboard. La cancelación será efectiva al final del período de facturación actual.",
      },
      {
        id: 13,
        question: "¿Ofrecen reembolsos?",
        answer:
          "Los reembolsos se evalúan caso por caso. Generalmente, los servicios digitales utilizados no son reembolsables, pero consideramos situaciones especiales.",
      },
      {
        id: 14,
        question: "¿Qué incluye cada plan de suscripción?",
        answer:
          "Cada plan incluye diferentes características: Básico (perfil estándar, 5 fotos), Premium (verificación, 15 fotos, 2 videos), VIP (contenido ilimitado, promoción especial). Ve nuestra página de precios para detalles completos.",
      },
    ],
  },
  {
    id: "technical",
    title: "Soporte Técnico",
    icon: Phone,
    questions: [
      {
        id: 15,
        question: "¿Por qué no puedo subir mis fotos?",
        answer:
          "Verifica que las imágenes sean JPG, PNG o GIF, no excedan 10MB cada una, y tengan buena resolución. Si el problema persiste, intenta desde otro navegador o dispositivo.",
      },
      {
        id: 16,
        question: "Mi perfil no aparece en las búsquedas, ¿por qué?",
        answer:
          "Tu perfil puede estar en proceso de verificación, inactivo, o necesitar optimización. Asegúrate de tener fotos, descripción completa y que tu perfil esté activo.",
      },
      {
        id: 17,
        question: "¿Cómo reporto un problema técnico?",
        answer:
          "Puedes reportar problemas técnicos a través del chat de soporte, email a soporte@onlineescorts.com, o usando el formulario de contacto en tu dashboard.",
      },
      {
        id: 18,
        question: "¿La plataforma funciona en dispositivos móviles?",
        answer:
          "Sí, nuestra plataforma está optimizada para dispositivos móviles y tablets. También puedes descargar nuestra app móvil para una mejor experiencia.",
      },
    ],
  },
  {
    id: "safety",
    title: "Seguridad y Privacidad",
    icon: HelpCircle,
    questions: [
      {
        id: 19,
        question: "¿Cómo protegen mi información personal?",
        answer:
          "Utilizamos encriptación SSL, servidores seguros, y cumplimos con estándares internacionales de protección de datos. Tu información nunca se comparte con terceros sin tu consentimiento.",
      },
      {
        id: 20,
        question: "¿Qué hago si recibo mensajes inapropiados?",
        answer:
          "Puedes bloquear usuarios, reportar mensajes inapropiados, y contactar a nuestro equipo de moderación. Tomamos muy en serio el acoso y comportamientos inapropiados.",
      },
      {
        id: 21,
        question: "¿Puedo controlar quién ve mi perfil?",
        answer:
          "Sí, puedes configurar la privacidad de tu perfil, bloquear usuarios específicos, y controlar qué información es visible públicamente.",
      },
      {
        id: 22,
        question: "¿Qué medidas de seguridad recomiendan para encuentros?",
        answer:
          "Recomendamos: verificar la identidad del cliente, encontrarse en lugares públicos primero, informar a alguien de confianza sobre tus citas, y confiar en tu instinto.",
      },
    ],
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [openItems, setOpenItems] = useState<number[]>([])
  const [activeCategory, setActiveCategory] = useState("general")

  const toggleItem = (id: number) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const filteredQuestions =
    faqCategories
      .find((cat) => cat.id === activeCategory)
      ?.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200 cursor-pointer">
                  Online Escorts
                </h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="outline" className="hover:bg-muted/50 transition-colors duration-200">
                  Dashboard
                </Button>
              </Link>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                Soporte
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Encuentra respuestas rápidas a las preguntas más comunes sobre nuestra plataforma.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Buscar en preguntas frecuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg bg-background border-2 focus:border-purple-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2 animate-in slide-in-from-left-4 duration-500">
              <h3 className="font-semibold text-foreground mb-4">Categorías</h3>
              {faqCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 animate-in slide-in-from-left-2 ${
                    activeCategory === category.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <category.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">{category.title}</span>
                    <p className="text-xs opacity-80 mt-1">{category.questions.length} preguntas</p>
                  </div>
                </button>
              ))}

              {/* Contact Support Card */}
              <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">¿No encuentras tu respuesta?</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Nuestro equipo de soporte está aquí para ayudarte.
                  </p>
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Contactar Soporte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {faqCategories.find((cat) => cat.id === activeCategory)?.title}
                </h2>
                <Badge variant="outline" className="text-sm">
                  {filteredQuestions.length} preguntas
                </Badge>
              </div>

              {searchTerm && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Mostrando {filteredQuestions.length} resultados para "{searchTerm}"
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <Card
                    key={question.id}
                    className="overflow-hidden transition-all duration-200 hover:shadow-md animate-in zoom-in-50"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Collapsible open={openItems.includes(question.id)} onOpenChange={() => toggleItem(question.id)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground text-left">
                              {question.question}
                            </CardTitle>
                            {openItems.includes(question.id) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="border-t border-border pt-4">
                            <p className="text-muted-foreground leading-relaxed">{question.answer}</p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron resultados</h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta con otros términos de búsqueda o explora diferentes categorías.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="hover:bg-muted/50 transition-colors duration-200"
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center animate-in fade-in-50 slide-in-from-bottom-8 duration-900">
          <h2 className="text-3xl font-bold text-foreground mb-4">¿Aún tienes preguntas?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier consulta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat en Vivo
            </Button>
            <Button variant="outline" className="hover:bg-muted/50 transition-colors duration-200">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
            <Button variant="outline" className="hover:bg-muted/50 transition-colors duration-200">
              <Phone className="h-4 w-4 mr-2" />
              Llamar Soporte
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
          🟢 NICOLAS ALVAREZ
        </Badge>
      </div>
    </div>
  )
}
