# Documentación Completa del Frontend - Scort Web Site

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Sistema de Autenticación](#sistema-de-autenticación)
5. [Módulos Principales](#módulos-principales)
6. [Componentes UI](#componentes-ui)
7. [Gestión de Estado](#gestión-de-estado)
8. [Servicios y APIs](#servicios-y-apis)
9. [Routing y Navegación](#routing-y-navegación)
10. [Formularios y Validación](#formularios-y-validación)
11. [Manejo de Archivos](#manejo-de-archivos)
12. [Estilos y Theming](#estilos-y-theming)
13. [Optimización y Performance](#optimización-y-performance)
14. [Testing](#testing)
15. [Deployment](#deployment)

---

## Arquitectura General

### Patrón de Arquitectura
- **Framework**: Next.js 14 con App Router
- **Patrón**: Component-based architecture
- **Estado**: React Context + Custom Hooks
- **Comunicación**: RESTful APIs
- **Routing**: File-based routing (App Router)

### Principios de Diseño
- **Componentes reutilizables**: UI components modulares
- **Separación de responsabilidades**: Lógica separada de presentación
- **Type Safety**: TypeScript en todo el proyecto
- **Responsive Design**: Mobile-first approach
- **Accesibilidad**: WCAG 2.1 compliance

---

## Stack Tecnológico

### Core Technologies
- **React 18**: Biblioteca principal
- **Next.js 14**: Framework full-stack
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de estilos
- **Shadcn/ui**: Componentes UI base

### Librerías Principales
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "next-auth": "^4.24.0",
    "react-hook-form": "^7.45.0",
    "zod": "^3.22.0",
    "axios": "^1.5.0",
    "lucide-react": "^0.263.0",
    "react-hot-toast": "^2.4.0",
    "framer-motion": "^10.16.0"
  }
}
```

### Herramientas de Desarrollo
- **ESLint**: Linting de código
- **Prettier**: Formateo de código
- **Husky**: Git hooks
- **Jest**: Testing unitario
- **Cypress**: Testing E2E

---

## Estructura del Proyecto

```
frontend/
├── app/                          # App Router (Next.js 14)
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   ├── dashboard/                # Panel de administración
│   ├── profile/                  # Páginas de perfil
│   ├── plans/                    # Páginas de planes
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
├── src/
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Componentes UI base (shadcn)
│   │   ├── forms/                # Componentes de formularios
│   │   ├── layout/               # Componentes de layout
│   │   └── common/               # Componentes comunes
│   ├── modules/                  # Módulos de funcionalidad
│   │   ├── auth/                 # Autenticación
│   │   ├── profile/              # Gestión de perfiles
│   │   ├── dashboard/            # Panel administrativo
│   │   ├── plans/                # Gestión de planes
│   │   ├── payments/             # Procesamiento de pagos
│   │   └── verification/         # Verificación de perfiles
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # Servicios de API
│   ├── types/                    # Definiciones de tipos
│   ├── utils/                    # Utilidades y helpers
│   └── lib/                      # Configuraciones de librerías
├── public/                       # Archivos estáticos
├── styles/                       # Archivos de estilos adicionales
└── tests/                        # Tests
```

---

## Sistema de Autenticación

### NextAuth.js Configuration
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Lógica de autenticación
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      // Personalizar JWT token
    },
    async session({ session, token }) {
      // Personalizar session
    }
  }
}
```

### Hooks de Autenticación
```typescript
// hooks/use-auth.ts
export const useAuth = () => {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    login: signIn,
    logout: signOut
  }
}
```

### Protección de Rutas
```typescript
// components/auth/ProtectedRoute.tsx
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) redirect('/login')
  
  return <>{children}</>
}
```

---

## Módulos Principales

### 1. Módulo de Autenticación (`/modules/auth`)

**Componentes:**
- `LoginForm.tsx`: Formulario de inicio de sesión
- `RegisterForm.tsx`: Formulario de registro
- `ForgotPasswordForm.tsx`: Recuperación de contraseña
- `AuthLayout.tsx`: Layout para páginas de auth

**Hooks:**
- `useAuth.ts`: Gestión de autenticación
- `useLogin.ts`: Lógica de login
- `useRegister.ts`: Lógica de registro

### 2. Módulo de Perfiles (`/modules/profile`)

**Componentes:**
- `ProfileForm.tsx`: Formulario de creación/edición
- `ProfileCard.tsx`: Tarjeta de perfil
- `ProfileGallery.tsx`: Galería de imágenes
- `ProfileDetails.tsx`: Detalles del perfil

**Hooks:**
- `useProfiles.ts`: Gestión de perfiles
- `useProfileForm.ts`: Lógica de formularios
- `useProfileUpload.ts`: Subida de archivos

### 3. Módulo de Dashboard (`/modules/dashboard`)

**Componentes:**
- `DashboardLayout.tsx`: Layout del dashboard
- `StatsCards.tsx`: Tarjetas de estadísticas
- `UserTable.tsx`: Tabla de usuarios
- `ProfileVerificationCarousel.tsx`: Carrusel de verificación

**Hooks:**
- `useDashboard.ts`: Datos del dashboard
- `useUsers.ts`: Gestión de usuarios
- `useStats.ts`: Estadísticas

### 4. Módulo de Planes (`/modules/plans`)

**Componentes:**
- `PlanCard.tsx`: Tarjeta de plan
- `PlanComparison.tsx`: Comparación de planes
- `UpgradeModal.tsx`: Modal de upgrade
- `PaymentForm.tsx`: Formulario de pago

**Hooks:**
- `usePlans.ts`: Gestión de planes
- `usePayment.ts`: Procesamiento de pagos
- `useInvoices.ts`: Gestión de facturas

### 5. Módulo de Verificación (`/modules/verification`)

**Componentes:**
- `VerificationForm.tsx`: Formulario de verificación
- `DocumentUpload.tsx`: Subida de documentos
- `VerificationStatus.tsx`: Estado de verificación
- `VerificationSteps.tsx`: Pasos de verificación

**Hooks:**
- `useVerification.ts`: Gestión de verificación
- `useDocumentUpload.ts`: Subida de documentos

---

## Componentes UI

### Sistema de Componentes Base (Shadcn/ui)

```typescript
// components/ui/button.tsx
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = ({ className, variant = 'default', size = 'default', ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

### Componentes Personalizados

#### Modal System
```typescript
// components/ui/modal.tsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  )
}
```

#### Image Upload Component
```typescript
// components/ui/image-upload.tsx
interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  accept?: string
}

export const ImageUpload = ({ value = [], onChange, maxFiles = 5, accept = 'image/*' }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false)
  
  const handleUpload = async (files: FileList) => {
    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(uploadToCloudinary)
      const urls = await Promise.all(uploadPromises)
      onChange([...value, ...urls])
    } catch (error) {
      toast.error('Error al subir imágenes')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <input
        type="file"
        multiple
        accept={accept}
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {uploading ? <Spinner /> : 'Seleccionar imágenes'}
        </div>
      </label>
      <ImagePreview images={value} onRemove={(index) => {
        const newImages = value.filter((_, i) => i !== index)
        onChange(newImages)
      }} />
    </div>
  )
}
```

---

## Gestión de Estado

### Context Providers

```typescript
// contexts/AppContext.tsx
interface AppContextType {
  user: User | null
  profiles: Profile[]
  plans: Plan[]
  loading: boolean
  error: string | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppContextType>({
    user: null,
    profiles: [],
    plans: [],
    loading: false,
    error: null
  })
  
  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

### Custom Hooks para Estado

```typescript
// hooks/use-profiles.ts
export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await profileService.getProfiles()
      setProfiles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])
  
  const createProfile = useCallback(async (profileData: CreateProfileData) => {
    try {
      const newProfile = await profileService.createProfile(profileData)
      setProfiles(prev => [...prev, newProfile])
      return newProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear perfil')
      throw err
    }
  }, [])
  
  useEffect(() => {
    fetchProfiles()
  }, [])
  
  return {
    profiles,
    loading,
    error,
    createProfile,
    refetch: fetchProfiles
  }
}
```

---

## Servicios y APIs

### Configuración de Axios
```typescript
// lib/axios.ts
import axios from 'axios'
import { getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000
})

// Interceptor para agregar token
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Servicios de API

```typescript
// services/profile.service.ts
class ProfileService {
  async getProfiles(filters?: ProfileFilters): Promise<Profile[]> {
    const response = await api.get('/profiles', { params: filters })
    return response.data.data
  }
  
  async createProfile(data: CreateProfileData): Promise<Profile> {
    const response = await api.post('/profiles', data)
    return response.data.data
  }
  
  async updateProfile(id: string, data: UpdateProfileData): Promise<Profile> {
    const response = await api.put(`/profiles/${id}`, data)
    return response.data.data
  }
  
  async deleteProfile(id: string): Promise<void> {
    await api.delete(`/profiles/${id}`)
  }
  
  async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    
    const response = await api.post('/profiles/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    return response.data.urls
  }
}

export const profileService = new ProfileService()
```

```typescript
// services/invoice.service.ts
class InvoiceService {
  async getUserInvoices(userId: string, params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedInvoices> {
    const response = await api.get(`/invoices/user/${userId}`, { params })
    return response.data.data
  }
  
  async getPendingInvoices(userId: string): Promise<Invoice[]> {
    const response = await api.get(`/invoices/user/${userId}/pending`)
    return response.data.data
  }
  
  async markAsPaid(invoiceId: string, paymentData: PaymentData): Promise<Invoice> {
    const response = await api.post('/invoices/webhook/payment-confirmed', {
      invoiceId,
      paymentData
    })
    return response.data.data
  }
}

export const invoiceService = new InvoiceService()
```

---

## Routing y Navegación

### App Router Structure
```
app/
├── (auth)/                    # Grupo de rutas de auth
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx             # Layout específico para auth
├── dashboard/
│   ├── users/
│   │   └── page.tsx
│   ├── profiles/
│   │   └── page.tsx
│   ├── invoices/
│   │   └── page.tsx
│   └── layout.tsx             # Layout del dashboard
├── profile/
│   ├── create/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── edit/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   └── layout.tsx
├── plans/
│   └── page.tsx
├── layout.tsx                 # Root layout
└── page.tsx                   # Home page
```

### Navigation Component
```typescript
// components/layout/Navigation.tsx
export const Navigation = () => {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/profile', label: 'Perfiles', icon: User },
    { href: '/plans', label: 'Planes', icon: CreditCard },
    { href: '/invoices', label: 'Facturas', icon: FileText }
  ]
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              Scort
            </Link>
            <div className="flex space-x-4">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium',
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <item.icon className="w-4 h-4 inline mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <Button onClick={logout} variant="outline" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

---

## Formularios y Validación

### React Hook Form + Zod

```typescript
// schemas/profile.schema.ts
import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  age: z.number().min(18, 'Debe ser mayor de edad').max(65, 'Edad máxima 65 años'),
  city: z.string().min(1, 'Ciudad es requerida'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  description: z.string().min(50, 'Descripción debe tener al menos 50 caracteres'),
  images: z.array(z.string().url()).min(3, 'Mínimo 3 imágenes requeridas'),
  planCode: z.string().min(1, 'Plan es requerido'),
  upgradeCodes: z.array(z.string()).optional()
})

export type ProfileFormData = z.infer<typeof profileSchema>
```

```typescript
// components/forms/ProfileForm.tsx
export const ProfileForm = ({ initialData, onSubmit }: ProfileFormProps) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData || {
      name: '',
      age: 18,
      city: '',
      phone: '',
      email: '',
      description: '',
      images: [],
      planCode: '',
      upgradeCodes: []
    }
  })
  
  const { handleSubmit, formState: { errors, isSubmitting } } = form
  
  const onFormSubmit = async (data: ProfileFormData) => {
    try {
      await onSubmit(data)
      toast.success('Perfil guardado exitosamente')
    } catch (error) {
      toast.error('Error al guardar perfil')
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imágenes del Perfil *</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  maxFiles={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Guardando...' : 'Guardar Perfil'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Manejo de Archivos

### Upload a Cloudinary
```typescript
// utils/upload.ts
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  )
  
  if (!response.ok) {
    throw new Error('Error al subir imagen')
  }
  
  const data = await response.json()
  return data.secure_url
}

export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(uploadToCloudinary)
  return Promise.all(uploadPromises)
}
```

### Image Optimization
```typescript
// utils/image.ts
export const optimizeImageUrl = (url: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpg' | 'png'
} = {}) => {
  const { width, height, quality = 80, format = 'auto' } = options
  
  if (!url.includes('cloudinary.com')) return url
  
  const transformations = []
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  transformations.push(`q_${quality}`)
  transformations.push(`f_${format}`)
  
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`)
}
```

---

## Estilos y Theming

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          500: '#ef4444',
          900: '#7f1d1d'
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

### CSS Variables para Theming
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 47.4% 11.2%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... más variables para modo oscuro */
}
```

---

## Optimización y Performance

### Next.js Optimizations
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    optimizeCss: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

### Lazy Loading Components
```typescript
// Lazy loading de componentes pesados
const ProfileGallery = dynamic(() => import('./ProfileGallery'), {
  loading: () => <div>Cargando galería...</div>,
  ssr: false
})

const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <DashboardSkeleton />
})
```

### Memoization
```typescript
// hooks/use-memoized-profiles.ts
export const useMemoizedProfiles = (filters: ProfileFilters) => {
  const { profiles, loading } = useProfiles()
  
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (filters.city && profile.city !== filters.city) return false
      if (filters.ageRange && !isInAgeRange(profile.age, filters.ageRange)) return false
      return true
    })
  }, [profiles, filters])
  
  return { profiles: filteredProfiles, loading }
}
```

### Virtual Scrolling
```typescript
// components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window'

interface VirtualizedListProps {
  items: any[]
  height: number
  itemHeight: number
  renderItem: ({ index, style }: { index: number; style: React.CSSProperties }) => React.ReactNode
}

export const VirtualizedList = ({ items, height, itemHeight, renderItem }: VirtualizedListProps) => {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  )
}
```

---

## Testing

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ]
}
```

### Unit Tests
```typescript
// __tests__/components/ProfileCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProfileCard } from '@/components/ProfileCard'

const mockProfile = {
  id: '1',
  name: 'Test Profile',
  age: 25,
  city: 'Bogotá',
  images: ['image1.jpg']
}

describe('ProfileCard', () => {
  it('renders profile information correctly', () => {
    render(<ProfileCard profile={mockProfile} />)
    
    expect(screen.getByText('Test Profile')).toBeInTheDocument()
    expect(screen.getByText('25 años')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })
  
  it('handles click events', async () => {
    const onClickMock = jest.fn()
    render(<ProfileCard profile={mockProfile} onClick={onClickMock} />)
    
    await userEvent.click(screen.getByRole('button'))
    expect(onClickMock).toHaveBeenCalledWith(mockProfile)
  })
})
```

### Integration Tests
```typescript
// __tests__/pages/profile/create.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateProfilePage from '@/app/profile/create/page'

jest.mock('@/services/profile.service')

describe('Create Profile Page', () => {
  it('creates profile successfully', async () => {
    const user = userEvent.setup()
    render(<CreateProfilePage />)
    
    await user.type(screen.getByLabelText(/nombre/i), 'Test Profile')
    await user.type(screen.getByLabelText(/edad/i), '25')
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/perfil creado exitosamente/i)).toBeInTheDocument()
    })
  })
})
```

---

## Deployment

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME": "@cloudinary-cloud-name"
  }
}
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Mejores Prácticas

### Code Organization
1. **Separación de responsabilidades**: Componentes, hooks, servicios separados
2. **Naming conventions**: PascalCase para componentes, camelCase para funciones
3. **File structure**: Agrupación por funcionalidad, no por tipo de archivo
4. **Import organization**: Librerías externas → internas → relativas

### Performance
1. **Lazy loading**: Componentes pesados cargados bajo demanda
2. **Memoization**: React.memo, useMemo, useCallback apropiadamente
3. **Image optimization**: Next.js Image component + Cloudinary
4. **Bundle analysis**: Análisis regular del tamaño del bundle

### Accessibility
1. **Semantic HTML**: Uso correcto de elementos semánticos
2. **ARIA labels**: Labels descriptivos para screen readers
3. **Keyboard navigation**: Navegación completa por teclado
4. **Color contrast**: Cumplimiento de estándares WCAG

### Security
1. **Input validation**: Validación tanto en cliente como servidor
2. **XSS prevention**: Sanitización de contenido dinámico
3. **CSRF protection**: Tokens CSRF en formularios
4. **Environment variables**: Secrets nunca en código cliente

---

## Próximas Mejoras

### Funcionalidades
1. **PWA**: Convertir en Progressive Web App
2. **Offline support**: Funcionalidad offline básica
3. **Push notifications**: Notificaciones push
4. **Real-time updates**: WebSockets para actualizaciones en tiempo real
5. **Advanced search**: Búsqueda con filtros avanzados
6. **Social features**: Sistema de likes, comentarios

### Técnicas
1. **State management**: Migrar a Zustand o Redux Toolkit
2. **GraphQL**: Implementar Apollo Client
3. **Micro-frontends**: Arquitectura de micro-frontends
4. **Server Components**: Migrar más componentes a RSC
5. **Edge functions**: Utilizar Vercel Edge Functions
6. **A/B testing**: Implementar testing A/B

---

*Documentación actualizada: Noviembre 2024*
*Versión: 2.1.0*

---

## Sistema de Rutas Dinámicas y Middleware

### Arquitectura de URL SEO-Friendly

El sistema implementa URLs limpias y amigables para SEO que soportan múltiples patrones de navegación.

#### Patrones de URL Soportados

```
1. /categoria/departamento/ciudad
   Ejemplo: /escort/bogota/usaquen

2. /categoria/departamento
   Ejemplo: /escort/bogota

3. /departamento/ciudad
   Ejemplo: /bogota/usaquen

4. /departamento
   Ejemplo: /bogota

5. /categoria
   Ejemplo: /escort

6. /filtros (con query params)
   Ejemplo: /filtros?departamento=bogota&ciudad=usaquen
```

### Flujo Completo de Navegación

#### 1. Generación de URL (FilterBar.tsx)

**Ubicación**: `frontend/src/modules/filters/components/FilterBar.tsx`

```typescript
const handleSearch = () => {
  const parts: string[] = [];

  // Normalizar valores: 'all' o vacío = no seleccionado
  const hasCategoria = categoria && categoria !== 'all';
  const hasDepartamento = departamento && departamento !== 'all';
  const hasCiudad = ciudad && ciudad !== 'all';

  // Prioridad 1: Si hay categoría, usarla primero
  if (hasCategoria) {
    parts.push(createSlug(categoria));
    if (hasDepartamento) parts.push(departamento);
    if (hasCiudad) parts.push(ciudad);
  }
  // Prioridad 2: Si NO hay categoría pero SÍ ubicación
  else if (hasDepartamento) {
    parts.push(departamento);
    if (hasCiudad) parts.push(ciudad);
  }

  const route = parts.length > 0 ? `/${parts.join('/')}` : '/filtros';
  router.push(route);
};
```

**Ejemplos de generación**:
```typescript
// Usuario selecciona: Escort + Bogotá → /escort/bogota
{ categoria: 'escort', departamento: 'bogota' }
→ parts: ['escort', 'bogota']
→ route: '/escort/bogota'

// Usuario selecciona: Solo Bogotá → /bogota
{ categoria: '', departamento: 'bogota' }
→ parts: ['bogota']
→ route: '/bogota'

// Usuario selecciona: Solo Escort → /escort
{ categoria: 'escort', departamento: '' }
→ parts: ['escort']
→ route: '/escort'
```

#### 2. Middleware de Next.js (middleware.ts)

**Ubicación**: `frontend/middleware.ts`

El middleware es la **capa crítica** que intercepta todas las solicitudes antes de llegar a las páginas.

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si es una ruta de categoría válida o departamento
  const slugMatch = pathname.match(/^\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  
  if (slugMatch) {
    const [, categoria, departamento, ciudad] = slugMatch;

    // Si el primer segmento NO es categoría válida
    if (categoria && !VALID_CATEGORIES.includes(categoria)) {
      // Verificar si es un departamento válido
      if (VALID_DEPARTMENTS.includes(categoria)) {
        // ✅ PERMITIR la URL (NO redirigir)
        return NextResponse.next();
      }
      // Si no es ni categoría ni departamento, continuar al 404
      return NextResponse.next();
    }
    
    // Validar departamento si está presente
    if (departamento && !VALID_DEPARTMENTS.includes(departamento)) {
      return NextResponse.next(); // 404
    }
  }

  return NextResponse.next();
}
```

**⚠️ IMPORTANTE - Bug Histórico Resuelto**:

**PROBLEMA ANTERIOR**:
```typescript
// ❌ ANTIGUO: Redirigía automáticamente
if (VALID_DEPARTMENTS.includes(categoria)) {
  const redirectUrl = new URL(`/escort/${categoria}`, request.url);
  return NextResponse.redirect(redirectUrl);
}
```

**Resultado**:
- URL generada: `/bogota`
- Middleware redirige a: `/escort/bogota`
- ❌ Usuario ve URL incorrecta

**SOLUCIÓN ACTUAL**:
```typescript
// ✅ NUEVO: Permite la URL sin redirigir
if (VALID_DEPARTMENTS.includes(categoria)) {
  return NextResponse.next();
}
```

**Resultado**:
- URL generada: `/bogota`
- Middleware permite: `/bogota`
- ✅ Usuario ve URL correcta

#### 3. Parsing de URL (page.tsx)

**Ubicación**: `frontend/app/[...slug]/page.tsx`

```typescript
async function ProfilesPage({ params, searchParams }) {
  const { slug } = await params;
  
  let categoria: string;
  let departamento: string | undefined;
  let ciudad: string | undefined;

  if (slug && slug.length > 0) {
    // CASO 1: /filtros (sin categoría, query params)
    if (slug[0] === 'filtros' && slug.length === 1) {
      categoria = '';
      departamento = queryParams.departamento;
      ciudad = queryParams.ciudad;
    }
    // CASO 2: /filtros/categoria
    else if (slug[0] === 'filtros' && slug.length > 1) {
      categoria = slug[1];
      departamento = queryParams.departamento;
      ciudad = queryParams.ciudad;
    }
    // CASO 3: Verificar si primer segmento es departamento
    else if (slug.length >= 1) {
      const isFirstSegmentDepartment = await isValidDepartment(slug[0]);
      
      if (isFirstSegmentDepartment) {
        // CASO 3a: /departamento o /departamento/ciudad
        categoria = ''; // Sin categoría
        departamento = slug[0];
        ciudad = slug.length >= 2 ? slug[1] : undefined;
      }
      // CASO 4: /categoria/departamento/ciudad
      else if (slug.length === 3) {
        [categoria, departamento, ciudad] = slug;
      }
      // CASO 5: /categoria/departamento
      else if (slug.length === 2) {
        [categoria, departamento] = slug;
      }
      // CASO 6: /categoria
      else {
        categoria = slug[0];
        departamento = queryParams.departamento;
        ciudad = queryParams.ciudad;
      }
    }
  }
  
  // Usar valores parseados para filtrar perfiles
  return <SearchPageClient initialFilters={{ categoria, departamento, ciudad }} />;
}
```

**Validación de Departamento**:

```typescript
async function isValidDepartment(departamento: string): Promise<boolean> {
  try {
    // Durante build, permitir todos (evitar errores de compilación)
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
      return true;
    }

    // Validar contra backend
    return await locationService.isValidDepartment(departamento);
  } catch (error) {
    return true; // Permitir en caso de error
  }
}
```

### Migración de Datos de Ubicación

#### Sistema Anterior (Estático)

```typescript
// ❌ DEPRECADO: colombiaData.ts
export const colombiaDepartments = {
  "Bogotá": ["Usaquén", "Chapinero", ...],
  "Antioquia": ["Medellín", "Bello", ...],
  ...
}

// Función local de validación
export const isValidDepartment = (name: string) => {
  return name in colombiaLocations;
}
```

**Problemas**:
- Datos hardcoded en código
- Requiere redeploy para actualizar
- No hay fuente de verdad única
- Desincronización frontend-backend

#### Sistema Actual (Dinámico)

```typescript
// ✅ NUEVO: locationService.ts
class LocationService {
  async isValidDepartment(value: string): Promise<boolean> {
    try {
      const url = `${API_URL}/api/locations/validate/department/${value}`;
      const result = await this.fetchJSON<{ isValid: boolean }>(url);
      return result.isValid;
    } catch (error) {
      console.error(`Error validating department ${value}:`, error);
      return false;
    }
  }
  
  async getDepartments(): Promise<LocationOption[]> {
    const url = `${API_URL}/api/locations/type/department`;
    return this.fetchJSON<LocationOption[]>(url);
  }
}
```

**Backend Endpoint**:
```typescript
// backend/src/routes/location.routes.ts
router.get('/validate/department/:value', async (req, res) => {
  const { value } = req.params;
  const location = await Location.findOne({ 
    type: 'department', 
    value,
    isActive: true 
  });
  res.json({ isValid: !!location });
});
```

**Beneficios**:
- ✅ Datos centralizados en MongoDB
- ✅ Actualización sin redeploy (admin panel)
- ✅ Validación consistente frontend-backend
- ✅ Cache con React Query (5-10 min)
- ✅ Escalable a jerarquías ilimitadas

### Hooks de React Query

```typescript
// hooks/use-locations.ts
export const useDepartments = () => {
  return useQuery({
    queryKey: ['locations', 'departments'],
    queryFn: () => locationService.getDepartments(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000   // 30 minutos
  });
};

export const useCitiesByDepartment = (departmentValue: string) => {
  return useQuery({
    queryKey: ['locations', 'cities', departmentValue],
    queryFn: () => locationService.getCitiesByDepartment(departmentValue),
    enabled: !!departmentValue,
    staleTime: 5 * 60 * 1000
  });
};
```

### Select Components con Valores Especiales

**Problema**: React Select no permite `value=""` (cadena vacía).

**Solución**: Usar `'all'` como valor y convertir en handlers.

```typescript
// FilterBar.tsx
const FilterBar = () => {
  // Estado interno normalizado
  const categoria = filters.category || '';
  
  // Select usa 'all' para representar "ninguna selección"
  return (
    <Select 
      value={categoria || 'all'} 
      onValueChange={handleCategoryChange}
    >
      <SelectItem value="all">Todas las categorías</SelectItem>
      {categories.map(c => (
        <SelectItem value={c.value}>{c.label}</SelectItem>
      ))}
    </Select>
  );
};

// Handler convierte 'all' → ''
const handleCategoryChange = (value: string) => {
  const newValue = value === 'all' ? '' : value;
  updateCategory(newValue);
};
```

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUARIO EN FILTROS                                       │
│    Selecciona: Solo "Bogotá" (sin categoría)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FILTERBAR.TSX                                            │
│    hasCategoria: false                                      │
│    hasDepartamento: true                                    │
│    parts: ['bogota']                                        │
│    route: '/bogota'                                         │
│    router.push('/bogota')                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MIDDLEWARE.TS                                            │
│    pathname: '/bogota'                                      │
│    slug[0]: 'bogota'                                        │
│    ¿Es categoría válida? NO                                 │
│    ¿Es departamento válido? SÍ                              │
│    ✅ NextResponse.next() → Permitir sin modificar          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PAGE.TSX [...slug]                                       │
│    slug: ['bogota']                                         │
│    isValidDepartment('bogota') → true                       │
│    CASO 3a ejecutado:                                       │
│      categoria = ''                                         │
│      departamento = 'bogota'                                │
│      ciudad = undefined                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SEARCHPAGECLIENT.TSX                                     │
│    Inicializa filtros:                                      │
│      category: ''                                           │
│      location: { department: 'bogota', city: '' }           │
│    Fetch perfiles con filtros aplicados                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. BACKEND API                                              │
│    GET /api/profiles?department=bogota                      │
│    Retorna perfiles filtrados por departamento              │
└─────────────────────────────────────────────────────────────┘
```

### Casos de Uso y Ejemplos

#### Caso 1: Búsqueda por categoría y ubicación
```typescript
// Usuario selecciona: Escort + Bogotá + Usaquén
FilterBar: { categoria: 'escort', departamento: 'bogota', ciudad: 'usaquen' }
→ URL: /escort/bogota/usaquen
→ Middleware: Permite (escort = categoría válida)
→ page.tsx: CASO 4 → categoria='escort', departamento='bogota', ciudad='usaquen'
```

#### Caso 2: Búsqueda solo por ubicación
```typescript
// Usuario selecciona: Solo Bogotá
FilterBar: { categoria: '', departamento: 'bogota', ciudad: '' }
→ URL: /bogota
→ Middleware: Valida departamento → Permite
→ page.tsx: CASO 3a → categoria='', departamento='bogota', ciudad=undefined
```

#### Caso 3: Búsqueda solo por categoría
```typescript
// Usuario selecciona: Solo Escort
FilterBar: { categoria: 'escort', departamento: '', ciudad: '' }
→ URL: /escort
→ Middleware: Permite (escort = categoría válida)
→ page.tsx: CASO 6 → categoria='escort', departamento=undefined, ciudad=undefined
```

#### Caso 4: Sin filtros
```typescript
// Usuario no selecciona nada, presiona buscar
FilterBar: { categoria: '', departamento: '', ciudad: '' }
→ URL: /filtros
→ Middleware: Permite
→ page.tsx: CASO 1 → categoria='', departamento=undefined, ciudad=undefined
→ Muestra todos los perfiles
```

### Debugging y Troubleshooting

#### Problema: URL se transforma incorrectamente

**Síntoma**: Usuario busca por "Bogotá" pero URL muestra `/escort/bogota`

**Causa**: Middleware antiguo redirigía departamentos a categoría por defecto

**Solución**: Actualizar middleware para permitir URLs de departamento sin redirección

```typescript
// ❌ ANTIGUO
if (VALID_DEPARTMENTS.includes(categoria)) {
  return NextResponse.redirect(new URL(`/escort/${categoria}`, request.url));
}

// ✅ NUEVO
if (VALID_DEPARTMENTS.includes(categoria)) {
  return NextResponse.next(); // Permitir sin modificar
}
```

#### Problema: Validación de departamento falla

**Síntoma**: Departamentos válidos no se reconocen

**Verificar**:
1. Backend API está funcionando:
   ```bash
   curl http://localhost:5000/api/locations/validate/department/bogota
   ```

2. MongoDB tiene los datos:
   ```javascript
   db.locations.findOne({ type: 'department', value: 'bogota' })
   ```

3. Variables de entorno configuradas:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

#### Problema: Selects no mantienen valor

**Síntoma**: Después de seleccionar, el select vuelve a "Todas"

**Verificar**:
1. Conversión 'all' ↔ '' es bidireccional:
   ```typescript
   // Al mostrar
   value={categoria || 'all'}
   
   // Al cambiar
   const newValue = value === 'all' ? '' : value;
   ```

2. Estado se actualiza correctamente:
   ```typescript
   updateCategory(newValue); // No updateCategory(value)
   ```

### Mejores Prácticas

#### 1. Generación de URLs

```typescript
// ✅ CORRECTO: Construir URL en orden lógico
const parts = [];
if (hasCategoria) parts.push(createSlug(categoria));
if (hasDepartamento) parts.push(departamento);
if (hasCiudad) parts.push(ciudad);
const url = `/${parts.join('/')}`;

// ❌ INCORRECTO: Concatenación directa
const url = `/${categoria}/${departamento}/${ciudad}`.replace(/\/+/g, '/');
```

#### 2. Validación de Segmentos

```typescript
// ✅ CORRECTO: Validar antes de asumir tipo
const isFirstSegmentDepartment = await isValidDepartment(slug[0]);
if (isFirstSegmentDepartment) {
  // Es departamento
} else {
  // Es categoría
}

// ❌ INCORRECTO: Asumir tipo sin validar
if (slug.length === 1) {
  // ¿Es categoría o departamento? No sabemos
}
```

#### 3. Manejo de Cache

```typescript
// ✅ CORRECTO: Cache apropiado para cada tipo de dato
// Departamentos cambian raramente → cache largo
useDepartments({ staleTime: 10 * 60 * 1000 });

// Perfiles cambian frecuentemente → cache corto
useProfiles({ staleTime: 1 * 60 * 1000 });

// ❌ INCORRECTO: Mismo cache para todo
useQuery({ staleTime: 5 * 60 * 1000 }); // Generic
```

#### 4. Error Handling

```typescript
// ✅ CORRECTO: Graceful degradation
async function isValidDepartment(dept: string) {
  try {
    return await locationService.isValidDepartment(dept);
  } catch (error) {
    console.error('Validation error:', error);
    return true; // Permitir en caso de error
  }
}

// ❌ INCORRECTO: Throw sin manejar
async function isValidDepartment(dept: string) {
  return await locationService.isValidDepartment(dept);
  // Si falla, toda la página crashea
}
```

### Archivos Clave

| Archivo | Responsabilidad | Líneas Críticas |
|---------|----------------|-----------------|
| `FilterBar.tsx` | Generar URLs desde filtros | handleSearch() |
| `middleware.ts` | Interceptar y validar URLs | líneas 240-255 |
| `[...slug]/page.tsx` | Parsear slug a filtros | líneas 220-280 |
| `location.service.ts` | Comunicación con backend | isValidDepartment() |
| `use-filter-options-query.ts` | Hooks de datos | useDepartmentsQuery() |

### Comandos Útiles

```bash
# Ver logs de middleware (desarrollo)
# Los middleware logs aparecen en la terminal del servidor Next.js

# Limpiar cache de Next.js
rm -rf .next

# Limpiar cache de navegador
# Chrome DevTools → Application → Clear Storage

# Verificar rutas generadas
# Next.js build muestra todas las rutas estáticas generadas
pnpm run build
```

---

## Sistema de Rutas Dinámicas y SSG

### Descripción General

Sistema de rutas dinámicas con Static Site Generation (SSG) que optimiza el SEO y la performance mediante pre-generación de páginas en build time.

### Estructura de Rutas

```
/[categoria]                    # Todos los perfiles de una categoría
/[categoria]/[departamento]     # Perfiles por categoría y departamento
/[categoria]/[departamento]/[ciudad] # Perfiles específicos por ubicación
```

#### Ejemplos Prácticos
- `/escort` - Todos los escorts
- `/escort/bogota` - Escorts en Bogotá
- `/escort/bogota/chapinero` - Escorts en Chapinero, Bogotá
- `/masajes/antioquia/medellin` - Masajistas en Medellín

### Implementación SSG

#### Generación de Parámetros Estáticos
```typescript
export async function generateStaticParams() {
  const staticParams: { slug: string[] }[] = [];

  // Rutas de solo categoría
  CATEGORIES.forEach(category => {
    staticParams.push({ slug: [category.value] });
  });

  // Rutas categoría + departamento
  CATEGORIES.forEach(category => {
    Object.keys(LOCATIONS).forEach(department => {
      staticParams.push({ slug: [category.value, department] });
    });
  });

  // Rutas populares completas
  POPULAR_ROUTES.forEach(route => {
    staticParams.push({ 
      slug: [route.categoria, route.departamento, route.ciudad] 
    });
  });

  return staticParams;
}
```

#### Metadata Dinámico
```typescript
export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const [categoria, departamento, ciudad] = params.slug || [];
  
  let pageTitle: string;
  let pageDescription: string;
  
  if (ciudad && departamento) {
    pageTitle = `${categoria} en ${cityLabel}, ${deptLabel} - Perfiles Verificados`;
    pageDescription = `Encuentra los mejores ${categoria} en ${cityLabel}, ${deptLabel}. Perfiles verificados y actualizados.`;
  } else if (departamento) {
    pageTitle = `${categoria} en ${deptLabel} - Perfiles Verificados`;
    pageDescription = `Descubre ${categoria} en ${deptLabel}. Amplia selección de perfiles verificados.`;
  } else {
    pageTitle = `${categoria} - Perfiles Verificados`;
    pageDescription = `Explora nuestra selección de ${categoria}. Perfiles verificados y de calidad.`;
  }

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}
```

### Configuración de Revalidación
```typescript
// Configuración en page.tsx
export const revalidate = 3600; // 1 hora

// ISR para rutas dinámicas
export const dynamicParams = true;
```

### Rutas Populares
```typescript
// src/lib/config.ts
export const POPULAR_ROUTES = [
  { categoria: 'escort', departamento: 'bogota', ciudad: 'chapinero' },
  { categoria: 'escort', departamento: 'antioquia', ciudad: 'el-poblado' },
  { categoria: 'escort', departamento: 'valle-del-cauca', ciudad: 'cali-aguacatal' },
  { categoria: 'masajes', departamento: 'bogota', ciudad: 'bogota' },
  { categoria: 'masajes', departamento: 'antioquia', ciudad: 'medellin' },
  { categoria: 'trans', departamento: 'bogota', ciudad: 'bogota' },
];
```

### Corrección: Categoría 'escorts' vs 'escort'

**Problema Identificado**: Inconsistencia entre frontend y backend en el nombre de la categoría.

**Solución**:
```typescript
// Antes
export const CATEGORIES = [
  { value: 'escorts', label: 'Escorts' }, // ❌ Plural
];

// Después
export const CATEGORIES = [
  { value: 'escort', label: 'Escorts' }, // ✅ Singular (coincide con backend)
];
```

### Middleware Inteligente
```typescript
// middleware.ts
if (categoria && !VALID_CATEGORIES.includes(categoria)) {
  // Si es un departamento, redirige a /escort/departamento
  if (VALID_DEPARTMENTS.includes(categoria)) {
    const redirectUrl = new URL(`/escort/${categoria}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
```

---

## Sistema de Sincronización de Autenticación Entre Pestañas

### Descripción General

Sistema que garantiza que cuando un usuario cierra sesión en una pestaña, **todas las demás pestañas abiertas** con la misma sesión también se deslogueen automáticamente sin necesidad de recargar.

### Arquitectura

#### Tecnologías Utilizadas

1. **BroadcastChannel API** (Método Principal)
   - API nativa del navegador para comunicación entre pestañas
   - Más eficiente que localStorage events
   - No contamina el storage
   - Mejor rendimiento

2. **localStorage events** (Fallback/Legacy)
   - Sistema antiguo para compatibilidad
   - Se activa en navegadores sin BroadcastChannel

#### Componentes del Sistema

```
frontend/
├── src/
│   ├── hooks/
│   │   └── use-auth-sync.ts              # Hook principal con BroadcastChannel
│   └── components/
│       └── authentication/
│           ├── AuthSyncHandler.tsx       # Componente wrapper del hook
│           └── SessionSyncHandler.tsx    # Sistema legacy (fallback)
```

### Implementación

#### Hook Principal: `use-auth-sync.ts`

**Responsabilidades:**
- Crear y gestionar el canal `BroadcastChannel` con nombre "auth"
- Escuchar mensajes de otras pestañas
- Detectar cambios en el estado de autenticación
- Emitir mensajes cuando cambia el estado (login/logout)
- Ejecutar `signOut({ redirect: false })` al recibir mensaje de logout

**Flujo de Logout:**
```
Pestaña A                    Canal "auth"                    Pestaña B
    |                             |                              |
    | 1. Usuario hace logout      |                              |
    | 2. status: authenticated    |                              |
    |    → unauthenticated        |                              |
    |                             |                              |
    | 3. Emitir { type: 'logout' }|                              |
    |------------------------->   |                              |
    |                             |----------------------------->|
    |                             |   4. Recibir mensaje         |
    |                             |   5. signOut({ redirect: false })
    |                             |   6. Redirigir a '/'         |
```

#### Función Helper: `broadcastLogout()`

```typescript
import { broadcastLogout } from '@/hooks/use-auth-sync';

// En tu botón de logout
<button onClick={() => broadcastLogout('/')}>
  Cerrar sesión
</button>
```

**Ventajas:**
- Notifica a otras pestañas ANTES de cerrar sesión
- Garantiza que el mensaje se envíe correctamente
- Fallback automático si falla el broadcast

#### Componente: `AuthSyncHandler.tsx`

```typescript
// src/config/providers.tsx
<SessionProvider>
  <AuthSyncHandler />    {/* Sistema moderno */}
  <SessionSyncHandler /> {/* Fallback legacy */}
  {children}
</SessionProvider>
```

### Casos de Uso

#### Escenario 1: Logout Manual
```
1. Usuario hace clic en "Cerrar sesión" en Pestaña A
2. Se ejecuta broadcastLogout('/')
3. BroadcastChannel emite mensaje { type: 'logout' }
4. Pestañas B, C, D reciben el mensaje
5. Todas ejecutan signOut({ redirect: false })
6. Todas redirigen a '/'
```

#### Escenario 2: Token Expirado
```
1. API responde 401 en Pestaña A
2. apiClient interceptor ejecuta signOut()
3. useAuthSync detecta status: unauthenticated
4. Emite { type: 'logout' } por BroadcastChannel
5. Otras pestañas se desloguean automáticamente
```

### Compatibilidad

**Navegadores con BroadcastChannel:**
- ✅ Chrome 54+
- ✅ Firefox 38+
- ✅ Safari 15.4+
- ✅ Edge 79+

**Navegadores sin BroadcastChannel:**
- ⚠️ Se activa automáticamente `SessionSyncHandler` (localStorage)

---

## Sistema de Pagos y Facturas

### Componentes Disponibles

#### 1. PaymentAlert
Componente de alerta que muestra información sobre facturas pendientes.

```tsx
import { PaymentAlert } from '@/components/payments';

<PaymentAlert
  invoiceCount={3}
  totalAmount={150000}
  onPayClick={() => console.log('Abrir modal de pagos')}
  className="mb-4"
/>
```

#### 2. InvoiceListModal
Modal que muestra la lista detallada de facturas con opciones de pago.

```tsx
import { InvoiceListModal } from '@/components/payments';

<InvoiceListModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  invoices={invoices}
  onPayInvoice={(id) => handlePayInvoice(id)}
  onPayAll={() => handlePayAll()}
  isLoading={isLoading}
/>
```

#### 3. PaymentManager
Componente principal que integra tanto la alerta como el modal de pagos.

```tsx
import { PaymentManager } from '@/components/payments';

// Uso completo (alerta + modal)
<PaymentManager className="mb-6" />

// Solo alerta (sin modal)
<PaymentManager showAlertOnly={true} className="mb-6" />
```

#### 4. useInvoices Hook
Hook personalizado para manejar la lógica de facturas y pagos.

```tsx
import { useInvoices } from '@/components/payments';

const {
  invoices,
  pendingInvoices,
  isLoading,
  totalPendingAmount,
  payInvoice,
  payAllInvoices,
  refreshInvoices
} = useInvoices(userId);
```

### Ejemplos de Integración

#### En el Dashboard
```tsx
// app/cuenta/dashboard/page.tsx
import { PaymentManager } from '@/components/payments';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Dashboard</h1>
      
      {/* Alerta de pagos pendientes */}
      <PaymentManager className="mb-6" />
      
      {/* Resto del contenido */}
    </div>
  );
}
```

### Características

- ✅ **Responsive**: Adaptación a diferentes tamaños de pantalla
- ✅ **Accesible**: Mejores prácticas de accesibilidad
- ✅ **TypeScript**: Completamente tipado
- ✅ **Integración con NextAuth**: Manejo automático de sesión
- ✅ **Notificaciones**: Usa Sonner para notificaciones
- ✅ **Estados de carga**: Maneja estados durante operaciones
- ✅ **Actualización automática**: Refresca datos después de operaciones
- ✅ **Alertas de vencimiento**: Para facturas que vencen pronto

### API Endpoints Requeridos

- `GET /api/invoices?userId={userId}` - Obtener facturas del usuario
- `POST /api/invoices/{invoiceId}/pay` - Pagar una factura específica
- `POST /api/invoices/pay-multiple` - Pagar múltiples facturas

---

## Módulo Step5Multimedia - Carga de Archivos

### Descripción

Componente modular para gestionar la carga de archivos multimedia (imágenes, videos, audios) en el proceso de creación de perfiles.

### Estructura Modular

```
Step5Multimedia/
├── components/          # Componentes reutilizables
│   ├── FileUploadZone.tsx
│   ├── LimitAlert.tsx
│   ├── FilesCounterBadge.tsx
│   ├── InfoMessage.tsx
│   └── index.ts
├── hooks/              # Custom hooks
│   ├── useContentLimits.ts
│   ├── useImageProcessing.ts
│   ├── useFileHandlers.ts
│   └── index.ts
├── types/              # Interfaces y tipos TypeScript
│   └── index.ts
├── utils/              # Funciones de utilidad
│   └── fileValidation.ts
├── Step5Multimedia.tsx # Componente principal
└── index.ts           # Punto de entrada
```

### Responsabilidades por Módulo

#### Components
- **FileUploadZone**: Zona de carga con drag & drop visual
- **LimitAlert**: Alerta cuando se alcanza límite del plan
- **FilesCounterBadge**: Badge con contador actual/máximo
- **InfoMessage**: Mensajes informativos, warnings y errores

#### Hooks
- **useContentLimits**: Maneja límites de contenido según el plan
- **useImageProcessing**: Procesa imágenes (compresión, watermark, crop)
- **useFileHandlers**: Maneja selección y eliminación de archivos

#### Types
- Interfaces para ContentLimits, DefaultPlanConfig
- Tipos FileType, ImageToCrop, VideoCoverToCrop
- Configuración de validación de archivos

#### Utils
- **fileValidation**: Valida tipos, tamaños y límites de archivos
- **extractFilesFromList**: Extrae archivos de FileList con fallbacks

### Uso

```tsx
import { Step5Multimedia } from '@/modules/create-profile/components/Step5Multimedia';

// En tu formulario
<Step5Multimedia />
```

### Mantenimiento

#### Agregar nuevo tipo de archivo
1. Actualizar `FileType` en `types/index.ts`
2. Agregar validación en `utils/fileValidation.ts`
3. Actualizar `handleFileSelect` en `hooks/useFileHandlers.ts`

#### Modificar límites por defecto
Editar valores iniciales en `hooks/useContentLimits.ts`

#### Agregar nuevo componente UI
1. Crear en `components/`
2. Exportar en `components/index.ts`
3. Importar en `Step5Multimedia.tsx`

### Notas Técnicas

- Todas las validaciones centralizadas en `utils/fileValidation.ts`
- Procesamiento de imágenes usa `@/utils/imageProcessor` (global)
- Modals de crop se mantienen en componente principal por complejidad

---

*Sección agregada: Noviembre 2024*
*Sistema de Rutas Dinámicas v1.0*