import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Award } from "lucide-react";

export default function CitizenScience() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8" data-testid="citizen-science-main">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Citizen Science Hub</h2>
          <p className="text-muted-foreground">
            Community-driven marine biodiversity monitoring
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Top contributors and achievements</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Badges and rewards system</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Gamification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Points and community challenges</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}