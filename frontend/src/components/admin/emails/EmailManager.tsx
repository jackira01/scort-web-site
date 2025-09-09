'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, Users, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/lib/axios';

interface User {
    id: string;
    username: string;
    email: string;
    profileName: string;
    profileId: string;
}

interface EmailData {
    subject: string;
    content: string;
    recipients: string[];
}

export default function EmailManager() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('individual');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [emailData, setEmailData] = useState<EmailData>({
        subject: '',
        content: '',
        recipients: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Cargar todos los usuarios para envío masivo
    useEffect(() => {
        if (activeTab === 'masivo') {
            fetchAllUsers();
        }
    }, [activeTab]);

    const fetchAllUsers = async () => {
        try {
            setIsLoading(true);
            const headers: HeadersInit = {};
            
            // Agregar header de autenticación si hay sesión
            if (session?.accessToken) {
                headers['Authorization'] = `Bearer ${session.accessToken}`;
            } else if (session?.user?._id) {
                headers['X-User-ID'] = session.user._id;
            }
            
            const response = await axios.get('/api/admin/emails/all-emails');
            const users = response.data;
            setAllUsers(users);
            setEmailData(prev => ({
                ...prev,
                recipients: users.map((user: User) => user.email)
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    const searchUsers = async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const headers: HeadersInit = {};
            
            // Agregar header de autenticación si hay sesión
            if (session?.user?._id) {
                headers['X-User-ID'] = session.user._id;
            }
            
            const response = await axios.get(`/api/admin/emails/users/search?q=${encodeURIComponent(term)}`);
            const users = response.data;
            setSearchResults(users);
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Error en la búsqueda');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = () => {
        if (searchTerm.trim()) {
            searchUsers(searchTerm.trim());
        } else {
            setSearchResults([]);
        }
    };

    const handleSearchInputChange = (value: string) => {
        setSearchTerm(value);
        // Limpiar resultados si el campo está vacío
        if (!value.trim()) {
            setSearchResults([]);
        }
    };

    const addUserToSelection = (user: User) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            const newSelection = [...selectedUsers, user];
            setSelectedUsers(newSelection);
            setEmailData(prev => ({
                ...prev,
                recipients: newSelection.map(u => u.email)
            }));
        }
    };

    const removeUserFromSelection = (userId: string) => {
        const newSelection = selectedUsers.filter(u => u.id !== userId);
        setSelectedUsers(newSelection);
        setEmailData(prev => ({
            ...prev,
            recipients: newSelection.map(u => u.email)
        }));
    };

    const sendEmail = async () => {
        if (!emailData.subject.trim() || !emailData.content.trim()) {
            toast.error('Por favor completa el asunto y contenido del correo');
            return;
        }

        if (emailData.recipients.length === 0) {
            toast.error('Selecciona al menos un destinatario');
            return;
        }

        try {
            setIsLoading(true);
            
            const response = await axios.post('/api/admin/emails/send', emailData);
            const result = response.data;
            
            if (result.success) {
                toast.success(result.message);
                
                // Mostrar información adicional si hubo errores parciales
                if (result.failed > 0) {
                    toast.warning(`${result.failed} correo(s) no pudieron ser enviados`);
                }
            } else {
                toast.error(result.message || 'Error al enviar correo');
            }
            
            // Reset form solo si fue exitoso
            if (result.success && result.failed === 0) {
                setEmailData({ subject: '', content: '', recipients: [] });
                setSelectedUsers([]);
                setSearchTerm('');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error('Error al enviar el correo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Envío de correos</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="individual" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Envío Individual
                    </TabsTrigger>
                    <TabsTrigger value="masivo" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Envío Masivo
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Búsqueda de usuarios
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Buscar por ID de perfil, nombre de usuario o nombre del perfil</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="search"
                                        placeholder="Ingresa ID, username o profileName..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchInputChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSearch}
                                        disabled={!searchTerm.trim() || isSearching}
                                        className="flex items-center gap-2"
                                    >
                                        {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                        Buscar
                                    </Button>
                                </div>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Resultados de búsqueda</Label>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {searchResults.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="space-y-1">
                                                    <p className="font-medium">{user.profileName}</p>
                                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    <Badge variant="outline">ID: {user.profileId}</Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => addUserToSelection(user)}
                                                    disabled={selectedUsers.some(u => u.id === user.id)}
                                                >
                                                    {selectedUsers.some(u => u.id === user.id) ? (
                                                        <CheckCircle className="h-4 w-4" />
                                                    ) : (
                                                        'Agregar'
                                                    )}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedUsers.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Usuarios seleccionados ({selectedUsers.length})</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUsers.map((user) => (
                                            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                                {user.profileName}
                                                <button
                                                    onClick={() => removeUserFromSelection(user.id)}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="masivo" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Envío masivo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    Cargando usuarios...
                                </div>
                            ) : (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Se enviará el correo a todos los usuarios registrados ({allUsers.length} destinatarios).
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Formulario de correo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Composición del correo
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Asunto</Label>
                        <Input
                            id="subject"
                            placeholder="Ingresa el asunto del correo..."
                            value={emailData.subject}
                            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Contenido</Label>
                        <Textarea
                            id="content"
                            placeholder="Escribe el contenido del correo..."
                            value={emailData.content}
                            onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                            rows={8}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Destinatarios: {emailData.recipients.length}
                        </div>
                        <Button
                            onClick={sendEmail}
                            disabled={isLoading || emailData.recipients.length === 0}
                            className="flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {isLoading ? 'Enviando...' : 'Enviar correo'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}