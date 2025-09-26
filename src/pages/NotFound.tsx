import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Página no encontrada</CardTitle>
          <CardDescription>
            La página que buscas no existe o ha sido movida
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Código de error: <span className="font-mono">404</span>
          </p>
          <Button asChild className="w-full">
            <a href="/" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
