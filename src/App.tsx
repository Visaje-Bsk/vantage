import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import Ordenes from "./pages/Ordenes";
import HistorialOrdenes from "./pages/HistorialOrdenes";
import Productos from "./pages/Productos";
import Catalogos from "./pages/Catalogos";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mantener datos en cache por más tiempo para catálogos
      staleTime: 5 * 60 * 1000, // 5 minutos
      // No refetch automático en ventana focus para catálogos
      refetchOnWindowFocus: false,
      // Reintentar solo una vez en caso de error
      retry: 1,
      // Mantener datos anteriores mientras se recargan
      placeholderData: (previousData: unknown) => previousData,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarProvider defaultOpen={true}>
                      <div className="flex min-h-screen w-full">
                        <AppSidebar />
                        <main className="flex-1 flex flex-col w-full overflow-hidden">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/ordenes" element={<Ordenes />} />
                            <Route path="/ordenes/historial" element={<HistorialOrdenes />} />
                            <Route path="/productos" element={<Productos />} />
                            <Route path="/catalogos" element={<Catalogos />} />
                            <Route
                              path="/admin"
                              element={
                                <ProtectedRoute adminOnly>
                                  <Admin />
                                </ProtectedRoute>
                              }
                            />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
