import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Fish, TreePine, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            BioDiversity Analytics Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Monitor marine biodiversity in real-time through environmental DNA analysis. 
            Join researchers and citizen scientists in protecting our oceans.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6" 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Droplets className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <CardTitle>eDNA Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and analyze environmental DNA samples to detect marine species
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Fish className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <CardTitle>Species Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identify endangered and invasive species with AI-powered analysis
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TreePine className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <CardTitle>Predictive Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get AI predictions for biodiversity trends and ecosystem health
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-purple-500 mb-4" />
              <CardTitle>Citizen Science</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Collaborate with researchers and contribute to marine conservation
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Ready to Explore Marine Biodiversity?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sign in with your account to access the full platform
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login-secondary"
          >
            Sign In Now
          </Button>
        </div>
      </div>
    </div>
  );
}