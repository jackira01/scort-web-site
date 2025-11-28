# 🛠️ Scort Web Site - Backend Documentation

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación Técnica](#documentación-técnica)
  - [Sistema de Verificación Automática (Cron)](#sistema-de-verificación-automática-cron)

## 🎯 Descripción

Documentación específica para el backend de la plataforma Scort Web Site.

---

## 📖 Documentación Técnica

### Sistema de Verificación Automática (Cron)

#### Descripción General

Este sistema ejecuta un proceso diario para verificar automáticamente el progreso de los perfiles que aún no han alcanzado el 100% de verificación.

#### Funcionamiento

- **Frecuencia**: Se ejecuta diariamente a las 03:00 AM.
- **Trigger Manual**: Se ejecuta inmediatamente al iniciar el servidor para asegurar la consistencia de datos.
- **Lógica de Proceso**:
  1. Identifica perfiles con `verificationProgress < 100`.
  2. Calcula la antigüedad de la cuenta basándose en `createdAt`.
  3. Compara con el parámetro de configuración `profile.verification.minimum_age_months`.
  4. Recalcula el progreso de verificación usando `calculateVerificationProgress`.
  5. Si el nuevo progreso es mayor al actual, actualiza el perfil en la base de datos.

#### Configuración

- **Parámetro**: `profile.verification.minimum_age_months`
- **Ubicación**: Sistema de Configuración Flexible (ConfigParameter)
- **Descripción**: Define el número de meses de antigüedad requeridos para obtener los puntos de verificación por antigüedad.
- **Valor por defecto**: 12 meses.
