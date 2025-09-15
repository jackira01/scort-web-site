import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error de Autenticación | Scort Web Site',
  description: 'Error durante el proceso de autenticación',
};

export default function ErrorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
