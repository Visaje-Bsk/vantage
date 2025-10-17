import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ordenes from "./pages/Ordenes";
import Productos from "./pages/Productos";
import Catalogos from "./pages/Catalogos";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Backdrop component para cerrar el sidebar al hacer click fuera
const SidebarBackdrop = () => {
  const { open, setOpen, isMobile } = useSidebar();

  if (!open || isMobile) return null;

  return (
    <div
      className="fixed inset-0 z-[5] bg-black/20 backdrop-blur-sm transition-opacity"
      onClick={() => setOpen(false)}
      aria-hidden="true"
    />
  );
};

const queryClient = new QueryClient();

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
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarProvider defaultOpen={false}>
                      <SidebarBackdrop />
                      <AppSidebar />
                      <main className="flex-1 flex flex-col w-full min-h-screen">
                        <header className="h-12 flex items-center border-b bg-background px-4 relative z-50">
                          <SidebarTrigger className="relative z-50" />
                        </header>
                        <div className="flex-1 overflow-auto">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/ordenes" element={<Ordenes />} />
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
                        </div>
                      </main>
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
