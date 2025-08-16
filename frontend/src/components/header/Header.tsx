'use client';

import { Menu, UserRound, ChevronDown, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SignIn, { SignOut } from '../authentication/sign-in';

const HeaderComponent = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl lg:text-2xl font-bold title-gradient bg-clip-text text-transparent hover:scale-105 transition-transform duration-200 cursor-pointer">
                  Online Escorts
                </h1>
              </Link>
            </div>
            {/* Desktop Search */}
            <div className="hidden lg:block">
              <div className="relative group">
                {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-purple-600 transition-colors duration-200" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 w-80 bg-muted/50 border-border focus:bg-background focus:border-purple-500 transition-all duration-200 focus:shadow-lg focus:shadow-purple-500/10"
                /> */}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Explorar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/adminboard" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Panel de administrador
                    </Link>
                  </DropdownMenuItem>
                )}
                {status === 'authenticated' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/cuenta" className="flex items-center">
                        <UserRound className="h-4 w-4 mr-2" />
                        Mi cuenta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div className="flex items-center w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        <SignOut />
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {status !== 'authenticated' && <SignIn />}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:bg-muted/50 transition-colors duration-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <div className="relative group">
            {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-purple-600 transition-colors duration-200" />
            <Input
              placeholder="Buscar..."
              className="pl-10 w-full bg-muted/50 border-border focus:bg-background focus:border-purple-500 transition-all duration-200"
            /> */}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background/95 backdrop-blur py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Explorar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/adminboard" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Panel de administrador
                    </Link>
                  </DropdownMenuItem>
                )}
                {status === 'authenticated' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/cuenta" className="flex items-center">
                        <UserRound className="h-4 w-4 mr-2" />
                        Mi cuenta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div className="flex items-center w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        <SignOut />
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {status !== 'authenticated' && <SignIn />}
            <div className="flex items-center justify-center pt-2">
              <Select defaultValue="español">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="español">🇪🇸 Español</SelectItem>
                  <SelectItem value="english">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderComponent;
