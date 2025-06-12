import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-[var(--dark-base)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="gradient-bg h-full w-full"></div>
        </div>

        <Card className="neumorphic border-0 bg-transparent">
          <CardContent className="p-8 text-center">
            {/* Logo and Title */}
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 gradient-bg rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">66</span>
              </div>
              <h1 className="font-sora font-bold text-3xl text-[var(--text-primary)] mb-2">
                Rise 66
              </h1>
              <p className="text-[var(--text-secondary)] text-lg">
                Your Personal Habit Reset Journey
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📈</span>
                </div>
                <span className="text-[var(--text-secondary)]">Track 9 powerful daily habits</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <span className="text-[var(--text-secondary)]">AI-powered journaling & insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🎯</span>
                </div>
                <span className="text-[var(--text-secondary)]">Progressive difficulty system</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔥</span>
                </div>
                <span className="text-[var(--text-secondary)]">Beautiful streak tracking</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-4">
              <Button
                onClick={handleLogin}
                className="w-full gradient-bg hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Start Your 66-Day Journey
              </Button>
              <p className="text-[var(--text-muted)] text-sm">
                Transform your life, one habit at a time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
