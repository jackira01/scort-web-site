"use client"

import { useState } from "react"
import { Heart, CheckCircle, Star, MapPin, Calendar, ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import HeaderComponent from "@/components/Header/Header"
import { categories, stories } from "@/utils/MockedData"
import CardComponent from "@/components/Card/Card"


export default function StoriesPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      
      <HeaderComponent />

      {/* Categories */}
      <div className="bg-background/95 backdrop-blur border-b transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 lg:space-x-8 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={category.id}
                className={`whitespace-nowrap px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-full transition-all duration-300 flex-shrink-0 hover:scale-105 ${
                  category.active
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg animate-in zoom-in-50"
                    : "text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-background/50 backdrop-blur border-b transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Género", placeholder: "Seleccionar género" },
              { label: "Ubicación", placeholder: "Seleccionar ciudad" },
              { label: "Edad", placeholder: "Rango de edad" },
              { label: "Cuerpo", placeholder: "Tipo de cuerpo" },
            ].map((filter, index) => (
              <div
                key={filter.label}
                className="animate-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Select>
                  <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Opción 1</SelectItem>
                    <SelectItem value="option2">Opción 2</SelectItem>
                    <SelectItem value="option3">Opción 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stories Section */}
        <div className="mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl lg:text-3xl font-bold  mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Últimas historias
          </h2>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="flex-shrink-0 cursor-pointer group animate-in zoom-in-50"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative">
                  <div
                    className={`p-1 rounded-full transition-all duration-300 ${
                      story.hasNew
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 group-hover:scale-110"
                        : "bg-gray-300 dark:bg-gray-600 group-hover:scale-105"
                    }`}
                  >
                    <Avatar className="h-16 w-16 lg:h-20 lg:w-20 border-2 border-background">
                      <AvatarImage src={story.avatar || "/placeholder.svg"} alt={story.user} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                        {story.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {story.hasNew && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground group-hover:text-foreground transition-colors duration-200 max-w-[80px] truncate">
                  {story.user}
                </p>
                <p className="text-xs text-center text-muted-foreground">{story.timestamp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Profiles Section */}
        <div className="animate-in fade-in-50 slide-in-from-bottom-6 duration-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold  bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Scorts populares
              </h2>
              <p className="text-muted-foreground mt-1">Personas destacadas</p>
            </div>
            <Button
              variant="outline"
              className="group hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Ver más
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>

          <CardComponent/>
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
