'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Send,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { ConfigParameterService } from '@/services/config-parameter.service';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactPage = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [companyEmail, setCompanyEmail] = useState('soporte@prepagosvip.com');
  const [companyWhatsApp, setCompanyWhatsApp] = useState('');

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const [email, whatsapp] = await Promise.all([
          ConfigParameterService.getByKey('company.email').then(param => param.value as string).catch(() => 'soporte@prepagosvip.com'),
          ConfigParameterService.getByKey('company.whatsapp.number').then(param => param.value as string).catch(() => '')
        ]);
        setCompanyEmail(email);
        setCompanyWhatsApp(whatsapp);
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/email/contact', formData);
      
      if (response.data.success) {
        setIsSubmitted(true);
        toast.success('Mensaje enviado exitosamente. Te contactaremos pronto.');
        // Limpiar formulario
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error(response.data.error || 'Error al enviar el mensaje');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Contáctanos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ¿Tienes alguna pregunta, sugerencia o necesitas ayuda? Estamos aquí para ayudarte. 
            Envíanos un mensaje y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Información de contacto */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-muted-foreground">{companyEmail}</p>
                  </div>
                </div>
                
                {companyWhatsApp && (
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">WhatsApp</h3>
                      <p className="text-muted-foreground">{companyWhatsApp}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => window.open(`https://wa.me/${companyWhatsApp.replace(/\D/g, '')}`, '_blank')}
                      >
                        Contactar por WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Horario de Atención</h3>
                    <p className="text-muted-foreground">Lunes a Viernes</p>
                    <p className="text-muted-foreground">9:00 AM - 6:00 PM (COT)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Tiempo de Respuesta</h3>
                    <p className="text-muted-foreground">Respondemos en menos de 24 horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de consulta */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>¿En qué podemos ayudarte?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Soporte técnico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Problemas con pagos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Verificación de perfiles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Consultas generales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Reportar problemas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Sugerencias y mejoras</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de contacto */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Envíanos un Mensaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      ¡Mensaje Enviado!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                    >
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Tu nombre completo"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="¿De qué se trata tu mensaje?"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Describe tu consulta, problema o sugerencia con el mayor detalle posible..."
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        * Campos obligatorios
                      </p>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="min-w-[120px]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Mensaje
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;