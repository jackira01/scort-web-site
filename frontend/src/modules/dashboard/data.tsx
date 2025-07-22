import { Receipt, Settings, User } from "lucide-react";

export const userProfiles = [
    {
        id: 1,
        name: "Jane Ximena",
        age: 23,
        category: "ESCORT",
        location: "Bogotá",
        image: "/placeholder.svg?height=120&width=120",
        views: "5.1k",
        rating: 4.9,
        status: "Activo",
        verified: true,
        featured: true,
        verificationImages: [
            {
                id: 1,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Foto de perfil principal",
            },
            {
                id: 2,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Documento de identidad",
            },
            {
                id: 3,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Foto adicional de verificación",
            },
        ],
    },
    {
        id: 2,
        name: "Sofia Martinez",
        age: 25,
        category: "ESCORT",
        location: "Medellín",
        image: "/placeholder.svg?height=120&width=120",
        views: "3.8k",
        rating: 4.7,
        status: "Activo",
        verified: true,
        featured: false,
        verificationImages: [
            {
                id: 4,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Foto de perfil principal",
            },
            {
                id: 5,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Documento de identidad",
            },
        ],
    },
    {
        id: 3,
        name: "Isabella Rodriguez",
        age: 24,
        category: "VIRTUAL",
        location: "Cali",
        image: "/placeholder.svg?height=120&width=120",
        views: "2.9k",
        rating: 4.8,
        status: "Pausado",
        verified: true,
        featured: true,
        verificationImages: [
            {
                id: 6,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Foto de perfil principal",
            },
            {
                id: 7,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Documento de identidad",
            },
            {
                id: 8,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Selfie de verificación",
            },
            {
                id: 9,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Foto adicional",
            },
        ],
    },
    {
        id: 4,
        name: "Camila Torres",
        age: 26,
        category: "ESCORT",
        location: "Cartagena",
        image: "/placeholder.svg?height=120&width=120",
        views: "4.2k",
        rating: 4.6,
        status: "Activo",
        verified: false,
        featured: false,
        verificationImages: [
            {
                id: 10,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Foto de perfil principal",
            },
            {
                id: 11,
                url: "/placeholder.svg?height=400&width=300",
                alt: "Documento de identidad pendiente",
            },
        ],
    },
];

export const sidebarItems = [
    {
        id: 'usuarios',
        label: 'Usuarios',
        icon: User,
        badge: '4',
        description:
            'Aquí puede ver, administrar y actualizar los usuarios existentes.',
        active: true,
    },
    {
        id: 'perfiles',
        label: 'Perfiles',
        icon: User,
        badge: '4',
        description:
            'Aquí puede ver, administrar y actualizar los perfiles existentes.',
        active: true,
    },
    {
        id: 'facturas',
        label: 'Saldo y Facturas',
        icon: Receipt,
        badge: null,
        description:
            'Vea el saldo de su cuenta, las facturas y los retiros recientes aquí.',
        active: false,
    },
    {
        id: 'ajustes',
        label: 'Ajustes',
        icon: Settings,
        badge: null,
        description:
            'Detalles generales',
        active: false,
    },
];