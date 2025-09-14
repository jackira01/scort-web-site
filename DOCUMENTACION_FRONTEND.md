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

*Documentación actualizada: Enero 2024*
*Versión: 2.0.0*