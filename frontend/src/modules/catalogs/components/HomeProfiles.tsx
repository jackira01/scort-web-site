import { ArrowRight } from 'lucide-react';
import CardComponent from '@/components/Card/Card';
import { Button } from '@/components/ui/button';

const HomeProfiles = () => {
  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold title-gradient bg-clip-text text-transparent">
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

      <CardComponent />
    </div>
  );
};

export default HomeProfiles;
