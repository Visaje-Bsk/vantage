import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProductCatalogs from '@/components/catalogs/ProductCatalogs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Productos() {
  const { profile } = useAuth();



  const capitalize = <T extends string>(str: T): Capitalize<T> => {
    return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Productos - {capitalize(profile?.role)}</h1>
                <p className="text-muted-foreground">
                  Gestión de catálogos de productos
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-8">
        <ProductCatalogs />
      </main>
    </div>
  );
}
