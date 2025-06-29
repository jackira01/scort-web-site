"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import AccountHeader from "@/components/AccountHeader"
import AccountProgressBar from "@/components/AccountProgressBar"
import ProfileList from "@/components/ProfileList"
import PaymentHistory from "@/components/PaymentHistory"
import AccountSettings from "@/components/AccountSettings"
import { Badge } from "@/components/ui/badge"

const userProfiles = [
	{
		id: 1,
		name: "Jane Ximena",
		age: 23,
		category: "ESCORT",
		location: "Bogotá",
		image: "/placeholder.svg?height=200&width=200",
		views: "5.1k",
		rating: 4.9,
		status: "Activo",
		verified: true,
		featured: true,
		completeness: 95,
	},
	{
		id: 2,
		name: "Sofia Martinez",
		age: 25,
		category: "ESCORT",
		location: "Medellín",
		image: "/placeholder.svg?height=200&width=200",
		views: "3.8k",
		rating: 4.7,
		status: "Activo",
		verified: true,
		featured: false,
		completeness: 78,
	},
	{
		id: 3,
		name: "Isabella Rodriguez",
		age: 24,
		category: "VIRTUAL",
		location: "Cali",
		image: "/placeholder.svg?height=200&width=200",
		views: "2.9k",
		rating: 4.8,
		status: "Pausado",
		verified: true,
		featured: true,
		completeness: 65,
	},
	{
		id: 4,
		name: "Camila Torres",
		age: 26,
		category: "ESCORT",
		location: "Cartagena",
		image: "/placeholder.svg?height=200&width=200",
		views: "4.2k",
		rating: 4.6,
		status: "Activo",
		verified: false,
		featured: false,
		completeness: 45,
	},
	{
		id: 5,
		name: "Valentina Cruz",
		age: 22,
		category: "VIRTUAL",
		location: "Barranquilla",
		image: "/placeholder.svg?height=200&width=200",
		views: "3.1k",
		rating: 4.5,
		status: "Activo",
		verified: true,
		featured: false,
		completeness: 82,
	},
	{
		id: 6,
		name: "Andrea Silva",
		age: 27,
		category: "ESCORT",
		location: "Pereira",
		image: "/placeholder.svg?height=200&width=200",
		views: "2.7k",
		rating: 4.4,
		status: "Activo",
		verified: true,
		featured: false,
		completeness: 91,
	},
]

const paymentHistory = [
	{
		id: 1,
		date: "2024-12-15",
		description: "Pago por servicios premium",
		amount: 250.0,
		status: "Completado",
		method: "Tarjeta de crédito",
	},
	{
		id: 2,
		date: "2024-12-10",
		description: "Impulso de perfil - Jane Ximena",
		amount: 75.0,
		status: "Completado",
		method: "PayPal",
	},
	{
		id: 3,
		date: "2024-12-05",
		description: "Suscripción mensual",
		amount: 150.0,
		status: "Completado",
		method: "Transferencia bancaria",
	},
	{
		id: 4,
		date: "2024-11-28",
		description: "Destacar perfil - Sofia Martinez",
		amount: 50.0,
		status: "Pendiente",
		method: "Tarjeta de débito",
	},
	{
		id: 5,
		date: "2024-11-20",
		description: "Pago por servicios adicionales",
		amount: 125.0,
		status: "Completado",
		method: "Tarjeta de crédito",
	},
]

export default function AccountPage() {
	const [activeSection, setActiveSection] = useState("perfiles")
	const [accountCompleteness] = useState(73) // Porcentaje de completitud de la cuenta

	const getProgressColor = (percentage: number) => {
		if (percentage < 50) return "bg-red-500"
		if (percentage < 80) return "bg-orange-500"
		return "bg-green-500"
	}
	const getProgressTextColor = (percentage: number) => {
		if (percentage < 50) return "text-red-600 dark:text-red-400"
		if (percentage < 80) return "text-orange-600 dark:text-orange-400"
		return "text-green-600 dark:text-green-400"
	}

	let content = null
	if (activeSection === "perfiles") {
		content = (
			<ProfileList
				profiles={userProfiles}
				getProgressColor={getProgressColor}
				getProgressTextColor={getProgressTextColor}
			/>
		)
	} else if (activeSection === "pagos") {
		content = <PaymentHistory payments={paymentHistory} />
	} else if (activeSection === "ajustes") {
		content = <AccountSettings />
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
			<AccountHeader />
			<AccountProgressBar
				percentage={accountCompleteness}
				getProgressColor={getProgressColor}
				getProgressTextColor={getProgressTextColor}
			/>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex gap-8">
					<Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
					<div className="flex-1">{content}</div>
				</div>
			</div>
			<div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
				<Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
					🟢 NICOLAS ALVAREZ
				</Badge>
			</div>
		</div>
	)
}
