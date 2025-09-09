import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Zap } from "lucide-react";

export default function LiveActivity() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8" data-testid="live-activity-main">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Activity Feed</h2>
          <p className="text-muted-foreground">
            Real-time system updates and monitoring
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real-time System Activity
          </CardTitle>
          <CardDescription>
            Live updates from biodiversity monitoring systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Live Activity Stream</h3>
            <p>Real-time processing updates, species detections, and system notifications</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}