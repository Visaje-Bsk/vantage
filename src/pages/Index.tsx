import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Your Blank Canvas
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Awaits
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground sm:text-2xl">
                A beautifully crafted starting point for your next amazing project. 
                Built with modern design principles and ready to be customized.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"></div>
            <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary-glow/30 blur-2xl"></div>
            <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;