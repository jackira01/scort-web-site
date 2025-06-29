import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, CheckCircle, Heart, Calendar, MapPin } from "lucide-react"
import { useState } from "react"
import { featuredProfiles } from "@/utils/MockedData" // Assuming you have a data file
import Link from "next/link"

const CardComponent = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProfiles.map((profile, index) => (
              <Card
                key={profile.id}
                className="group hover:shadow-2xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50 cursor-pointer animate-in zoom-in-50"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={profile.image || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-full h-64 lg:h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Status Indicators */}
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {profile.featured && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse">
                        <Star className="h-3 w-3 mr-1" />
                        DESTACADO
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex space-x-2">
                    {profile.verified && (
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:scale-110 transition-transform duration-200">
                        <CheckCircle className="h-3 w-3" />
                      </Badge>
                    )}
                    {profile.online && (
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
                    )}
                  </div>

                  {/* Heart Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute bottom-3 right-3 bg-background/90 hover:bg-background backdrop-blur p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  >
                    <Heart className="h-4 w-4 hover:fill-red-500 hover:text-red-500 transition-colors duration-200" />
                  </Button>

                  {/* Rating */}
                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{profile.rating}</span>
                      <span className="text-xs text-muted-foreground">({profile.reviews})</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 transition-colors duration-300">
                      {profile.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center hover:text-foreground transition-colors duration-200">
                        <Calendar className="h-3 w-3 mr-1" />
                        {profile.age} años
                      </span>
                      <span className="flex items-center hover:text-foreground transition-colors duration-200">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </span>
                    </div>
                    <Link href={`/profile/${profile.id}`}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 mt-3">
                      Ver perfil
                    </Button>
                    </Link>
                    
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
  )
}

export default CardComponent