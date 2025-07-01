import { Zap } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function AccountHeader() {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10 border-2 border-purple-500/20">
              <AvatarImage
                src="/placeholder.svg?height=40&width=40"
                alt="Nicolas Alvarez"
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 font-semibold">
                NA
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">NICOLAS ALVAREZ</h2>
              <p className="text-xs text-muted-foreground">
                Agencia • tecnologico03@gmail.com
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <ThemeToggle />
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-105 transition-all duration-200"
            >
              <Zap className="h-4 w-4 mr-2" />
              Impulsarme
            </Button>
            <Link href="/">
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 transition-all duration-200"
              >
                Cerrar sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
