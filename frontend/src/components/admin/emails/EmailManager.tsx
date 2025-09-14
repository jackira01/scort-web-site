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
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { useAllEmailUsers, useSearchEmailUsersAction } from '@/hooks/use-email-users';

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
    const [usernameSearch, setUsernameSearch] = useState('');
    const [userIdSearch, setUserIdSearch] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [emailData, setEmailData] = useState<EmailData>({
        subject: '',
        content: '',
        recipients: []
    });

    // Usar hooks de React Query
    const { data: allUsers = [], isLoading: isLoadingUsers, error: allUsersError } = useAllEmailUsers();
    const { searchUsers } = useSearchEmailUsersAction();

    // Actualizar recipients cuando cambian los usuarios para envío masivo
    useEffect(() => {
        if (activeTab === 'masivo' && allUsers.length > 0) {
            setEmailData(prev => ({
                ...prev,
                recipients: allUsers.map((user: User) => user.email)
            }));
        }
    }, [activeTab, allUsers]);

    // Mostrar errores si ocurren
    useEffect(() => {
        if (allUsersError) {
            // Error handled by query
            toast.error('Error al cargar usuarios');
        }
    }, [allUsersError]);

    const handleSearch = async (type?: 'username' | 'id') => {
        let searchTerm = '';
        let searchType = type || 'username';
        
        // Determinar qué buscar según el tipo especificado o los campos llenos
        if (type === 'username') {
            if (!usernameSearch.trim()) return;
            searchTerm = usernameSearch.trim();
            searchType = 'username';
        } else if (type === 'id') {
            if (!userIdSearch.trim()) return;
            searchTerm = userIdSearch.trim();
            searchType = 'id';
        } else {
            // Búsqueda automática (para Enter key)
            if (usernameSearch.trim()) {
                searchTerm = usernameSearch.trim();
                searchType = 'username';
            } else if (userIdSearch.trim()) {
                searchTerm = userIdSearch.trim();
                searchType = 'id';
            } else {
                return;
            }
        }
        
        setIsSearching(true);
        try {
            const users = await searchUsers(searchTerm, searchType);
            setSearchResults(users);
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Error al buscar usuarios. Inténtalo de nuevo.');
        } finally {
            setIsSearching(false);
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
            setIsSending(true);

            const response = await axios.post('/api/admin/emails/send', emailData);
            const result = response.data;

            if (result.success) {
                toast.success(result.message);

                // Mostrar información adicional si hubo errores parciales
                if (result.failed > 0) {
                    toast(`${result.failed} correo(s) no pudieron ser enviados`, {
                        icon: '⚠️',
                        style: {
                            background: '#fbbf24',
                            color: '#92400e'
                        }
                    });
                }
            } else {
                toast.error(result.message || 'Error al enviar correo');
            }

            // Reset form solo si fue exitoso
            if (result.success && result.failed === 0) {
                setEmailData({ subject: '', content: '', recipients: [] });
                setSelectedUsers([]);
                setSearchResults([]);
                setUsernameSearch('');
                setUserIdSearch('');
            }
        } catch (error) {
            toast.error('Error al enviar el correo');
        } finally {
            setIsSending(false);
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
                            <div className="space-y-4">
                                <Label>Criterios de búsqueda</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username-search">Buscar por nombre de usuario</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="username-search"
                                                placeholder="Buscar por nombre de usuario..."
                                                value={usernameSearch}
                                                onChange={(e) => setUsernameSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="flex-1"
                                            />
                                            <Button
                                                 onClick={() => handleSearch('username')}
                                                 disabled={isSearching || !usernameSearch.trim()}
                                                 size="sm"
                                                 className="flex items-center gap-2"
                                             >
                                                 {isSearching ? (
                                                     <Loader2 className="h-4 w-4 animate-spin" />
                                                 ) : (
                                                     <Search className="h-4 w-4" />
                                                 )}
                                             </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="userid-search">Buscar por ID de usuario</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="userid-search"
                                                placeholder="Buscar por ID de usuario..."
                                                value={userIdSearch}
                                                onChange={(e) => setUserIdSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="flex-1"
                                            />
                                            <Button
                                                 onClick={() => handleSearch('id')}
                                                 disabled={isSearching || !userIdSearch.trim()}
                                                 size="sm"
                                                 className="flex items-center gap-2"
                                             >
                                                 {isSearching ? (
                                                     <Loader2 className="h-4 w-4 animate-spin" />
                                                 ) : (
                                                     <Search className="h-4 w-4" />
                                                 )}
                                             </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                {searchResults.length > 0 && (
                                    <div className="flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSearchResults([]);
                                                setUsernameSearch('');
                                                setUserIdSearch('');
                                            }}
                                            className="text-sm"
                                        >
                                            Limpiar búsqueda
                                        </Button>
                                    </div>
                                )}
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
                            {isLoadingUsers ? (
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
                            disabled={isSending || emailData.recipients.length === 0}
                            className="flex items-center gap-2"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {isSending ? 'Enviando...' : 'Enviar correo'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}