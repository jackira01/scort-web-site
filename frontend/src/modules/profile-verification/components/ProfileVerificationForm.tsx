'use client';

import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfileVerification } from '@/hooks/use-profile-verification';
import { VerificationStepsForm } from './VerificationStepsForm';

interface ProfileVerificationFormProps {
  profileId: string;
}

export function ProfileVerificationForm({ profileId }: ProfileVerificationFormProps) {
  const { data: verificationData, isLoading, error } = useProfileVerification(profileId);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar los datos de verificación</p>
        <Link href="/cuenta">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis perfiles
          </Button>
        </Link>
      </div>
    );
  }

  const verification = verificationData?.data;
  
  if (!verification) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No se encontraron datos de verificación</p>
        <Link href="/cuenta">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis perfiles
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusIcon = (isVerified: boolean) => {
    if (isVerified) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/cuenta">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Verificación de Perfil
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Gestiona la verificación del perfil: <span className="font-medium text-gray-800 dark:text-gray-200">{verification.profile.name}</span></p>
          </div>
        </div>
        {getStatusBadge(verification.verificationStatus)}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso de Verificación</span>
            <span className="text-2xl font-bold text-purple-600">
              {verification.verificationProgress}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${verification.verificationProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Completa todos los pasos para verificar tu perfil y aumentar tu credibilidad.
          </p>
        </CardContent>
      </Card>

      {/* Verification Steps Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de los Pasos de Verificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.documentPhotos.isVerified)}
                <span className="font-medium">Fotos de Documentos</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.documentPhotos.documents.length} archivo(s)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.selfieWithPoster.isVerified)}
                <span className="font-medium">Selfie con Póster</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.selfieWithPoster.photo ? 'Completado' : 'Pendiente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.selfieWithDoc.isVerified)}
                <span className="font-medium">Selfie con Documento</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.selfieWithDoc.photo ? 'Completado' : 'Pendiente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.fullBodyPhotos.isVerified)}
                <span className="font-medium">Fotos de Cuerpo Completo</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.fullBodyPhotos.photos.length} foto(s)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.video.isVerified)}
                <span className="font-medium">Video de Verificación</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.video.videoLink ? 'Completado' : 'Pendiente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.videoCallRequested.isVerified)}
                <span className="font-medium">Videollamada</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.videoCallRequested.videoLink ? 'Completado' : 'Pendiente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verification.steps.socialMedia.isVerified)}
                <span className="font-medium">Redes Sociales</span>
              </div>
              <span className="text-sm text-gray-500">
                {verification.steps.socialMedia.accounts.length} cuenta(s)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Actualizar Información de Verificación
          </Button>
        ) : (
          <Button
            onClick={() => setShowForm(false)}
            variant="outline"
          >
            Cancelar Edición
          </Button>
        )}
      </div>

      {/* Verification Form */}
      {showForm && (
        <VerificationStepsForm 
          profileId={profileId}
          verificationId={verification._id}
          initialData={verification.steps}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
}