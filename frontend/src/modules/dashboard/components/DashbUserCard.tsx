import { useState } from 'react';
import {
  Edit,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import EditUserModal from '@/components/EditUserModal';
import UserDocumentVerificationModal from './UserDocumentVerificationModal';
import type { User } from '@/types/user.types';

export const DashboardUserCard = ({
  user,
  index,
  setSelecteduserForVerification,
  setVerificationCarouselOpen,
}: {
  user: User;
  index: number;
  setSelecteduserForVerification: any
  setVerificationCarouselOpen: any
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocumentVerificationModalOpen, setIsDocumentVerificationModalOpen] = useState(false);
  return (
    <>
      <Card
        className="group hover:shadow-xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50 "
        style={{ animationDelay: `${index * 150}ms` }}
      >
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300">

                <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-lg font-semibold">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              {/* {user.featured && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            )} */}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 transition-colors duration-300">
                  {user.name}
                </h3>

                <Badge
                  variant={user.isVerified ? 'default' : 'secondary'}
                  className={
                    user.isVerified
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                      : ''
                  }
                >
                  {user.isVerified ? 'Verificado' : 'No verificado'}
                </Badge>
              </div>



              <div className="flex items-center space-x-4 text-sm"></div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="flex space-x-2 flex-wrap gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              {/* <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDocumentVerificationModalOpen(true)}
                className="hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500 transition-all duration-200"
              >
                <Shield className="h-3 w-3 mr-1" />
                Verificar
              </Button> */}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelecteduserForVerification(user);
                  setVerificationCarouselOpen(true);
                }}
                className="hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
              >
                <Shield className="h-3 w-3 mr-1" />
                Verificar Perfil
              </Button>

            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserModal
        user={user}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <UserDocumentVerificationModal
        user={user}
        isOpen={isDocumentVerificationModalOpen}
        onOpenChange={setIsDocumentVerificationModalOpen}
      />
    </>
  );
};
