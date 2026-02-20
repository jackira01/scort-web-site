'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Instagram } from 'lucide-react';

type ContactData = {
  number: string;
  whatsapp?: string;
  telegram?: string;
};

type SocialMediaData = {
  instagram?: string;
  onlyfans?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
};

interface SocialMediaProfileProps {
  contact: ContactData;
  socialMedia?: SocialMediaData;
  profileName?: string;
}

export const SocialMediaProfile = ({
  contact,
  socialMedia,
  profileName = '',
}: SocialMediaProfileProps) => {
  // Helper function to check if contact method is valid
  const isValidContactMethod = (value?: string): boolean => {
    return !!(value && value !== 'false' && value.trim() !== '');
  };

  // Helper function to check if any social media is configured
  const hasSocialMedia = (): boolean => {
    return !!(
      socialMedia?.instagram
      // socialMedia?.onlyfans ||
      // socialMedia?.twitter ||
      // socialMedia?.facebook ||
      // socialMedia?.tiktok
    );
  };

  // Helper function to check if any contact method is available
  const hasContactMethods = (): boolean => {
    return !!(
      contact.number ||
      isValidContactMethod(contact.whatsapp) ||
      isValidContactMethod(contact.telegram)
    );
  };

  // Don't render the component if no social media and no contact methods are available
  if (!hasSocialMedia() && !hasContactMethods()) {
    return null;
  }

  const handleContactClick = (platform: string, number: string) => {
    if (platform === 'call') {
      window.open(`tel:${number.replace(/\s+/g, '')}`, '_self');
      return;
    }

    const cleanNumber = number.replace(/\s+/g, '');

    if (platform === 'whatsapp') {
      const message = `Hola ${profileName} vi tu perfil en prepagoya.com y deseo un encuentro contigo.`;
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      return;
    }

    const urls = {
      telegram: `https://t.me/${cleanNumber}`,
    };

    // @ts-ignore
    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleSocialClick = (platform: string, handle: string) => {
    const urls = {
      instagram: `https://instagram.com/${handle.replace('@', '')}`,
      onlyfans: `https://onlyfans.com/${handle.replace('@', '')}`,
      twitter: `https://twitter.com/${handle.replace('@', '')}`,
      facebook: `https://facebook.com/${handle}`,
      tiktok: `https://tiktok.com/@${handle.replace('@', '')}`,
    };
    window.open(urls[platform as keyof typeof urls], '_blank');
  };
  return (
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-6 duration-700">
      <CardContent className="p-4 space-y-3">
        {/* Botones de contacto condicionales */}
        {isValidContactMethod(contact.number) && (
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            onClick={() =>
              handleContactClick('call', contact.number)
            }
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            Llamar
          </Button>
        )}

        {isValidContactMethod(contact.whatsapp) && (
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            onClick={() =>
              handleContactClick('whatsapp', contact.whatsapp || '')
            }
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            WhatsApp
          </Button>
        )}

        {isValidContactMethod(contact.telegram) && (
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() =>
              handleContactClick('telegram', contact.telegram || '')
            }
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Telegram
          </Button>
        )}

        {/* Redes sociales condicionales */}
        {socialMedia?.instagram && (
          <Button
            variant="outline"
            className="w-full hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-500"
            onClick={() =>
              handleSocialClick('instagram', socialMedia.instagram!)
            }
          >
            <Instagram className="h-4 w-4 mr-2" />
            @{socialMedia.instagram.replace('@', '')}
          </Button>
        )}

        {/* {socialMedia?.onlyfans && (
          <Button
            variant="outline"
            className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500"
            onClick={() =>
              handleSocialClick('onlyfans', socialMedia.onlyfans!)
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver OnlyFans
          </Button>
        )} */}

        {/* {socialMedia?.twitter && (
          <Button
            variant="outline"
            className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500"
            onClick={() =>
              handleSocialClick('twitter', socialMedia.twitter!)
            }
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Ver Twitter/X
          </Button>
        )} */}

        {/* {socialMedia?.facebook && (
          <Button
            variant="outline"
            className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500"
            onClick={() =>
              handleSocialClick('facebook', socialMedia.facebook!)
            }
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Ver Facebook
          </Button>
        )} */}

        {/* {socialMedia?.tiktok && (
          <Button
            variant="outline"
            className="w-full hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-500"
            onClick={() =>
              handleSocialClick('tiktok', socialMedia.tiktok!)
            }
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.16 20.5a6.34 6.34 0 0 0 10.86-4.43V7.83a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.2-.26z" />
            </svg>
            Ver TikTok
          </Button>
        )} */}
      </CardContent>
    </Card>
  );
};
