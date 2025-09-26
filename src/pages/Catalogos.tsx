import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleCatalogs from '@/components/catalogs/RoleCatalogs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Catalogos() {
  const { profile } = useAuth();

  // Redirect admin users to admin panel
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const capitalize = <T extends string>(str: T): Capitalize<T> => {
    return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Catálogos - {capitalize(profile?.role)}</h1>
              <p className="text-muted-foreground">
                Gestión de catálogos para tu área
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-8">
        <RoleCatalogs />
      </main>
    </div>
  );
}