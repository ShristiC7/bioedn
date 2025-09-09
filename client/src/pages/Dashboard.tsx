import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  AlertTriangle, 
  Fish, 
  Users, 
  TrendingUp, 
  MapPin, 
  Upload, 
  Zap,
  Globe,
  Database
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useWebSocket } from "@/hooks/useWebSocket";

interface DashboardStats {
  speciesCount: number;
  activeSamples: number;
  alertsCount: number;
  citizenCount: number;
}

interface ActivityItem {
  type: string;
  timestamp: string;
  message: string;
  data?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: activity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/live/activity'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: distribution } = useQuery({
    queryKey: ['/api/species/distribution']
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts/unread']
  });

  // Real-time WebSocket connection
  const { isConnected, lastMessage } = useWebSocket();

  // Mock trend data for biodiversity index
  const trendData = [
    { name: 'Jan', biodiversity: 65, species: 1240 },
    { name: 'Feb', biodiversity: 68, species: 1280 },
    { name: 'Mar', biodiversity: 72, species: 1350 },
    { name: 'Apr', biodiversity: 70, species: 1320 },
    { name: 'May', biodiversity: 75, species: 1420 },
    { name: 'Jun', biodiversity: 78, species: 1480 },
  ];

  const pieData = distribution?.map((item: any, index: number) => ({
    name: item.category,
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading biodiversity analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8" data-testid="dashboard-main">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Marine Biodiversity Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring and analysis of marine ecosystem health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button size="sm" data-testid="button-refresh">
            <Activity className="h-4 w-4 mr-2" />
            Real-time Active
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate" data-testid="card-species-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Species Detected</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats?.speciesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-active-samples">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Samples</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{stats?.activeSamples || 0}</div>
            <p className="text-xs text-muted-foreground">
              Processing in real-time
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-alerts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.alertsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Endangered species detected
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-citizen-scientists">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citizen Scientists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{stats?.citizenCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Live Activity</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Biodiversity Trend Analysis
                </CardTitle>
                <CardDescription>
                  Real-time biodiversity index and species count over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="biodiversity" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      name="Biodiversity Index"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="species" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Species Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Species Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown by marine life categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm capitalize">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact Analysis</CardTitle>
                <CardDescription>
                  Key factors affecting marine biodiversity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ocean Temperature</span>
                    <span className="text-sm font-medium">26.5°C</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">pH Levels</span>
                    <span className="text-sm font-medium">8.1</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Salinity</span>
                    <span className="text-sm font-medium">35.2‰</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Model Performance</CardTitle>
                <CardDescription>
                  Species identification accuracy metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accuracy</span>
                    <span className="text-sm font-medium">87.2%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Precision</span>
                    <span className="text-sm font-medium">85.4%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recall</span>
                    <span className="text-sm font-medium">89.1%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Live System Activity
              </CardTitle>
              <CardDescription>
                Real-time updates from the biodiversity monitoring system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity?.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-md hover-elevate border">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      item.type === 'alert' ? 'bg-red-500' : 
                      item.type === 'detection' ? 'bg-green-500' : 
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Species Conservation Alerts
              </CardTitle>
              <CardDescription>
                Real-time notifications for endangered and invasive species
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts?.map((alert: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-md border border-destructive/20 bg-destructive/5">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {alert.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-8">
                    No active alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Start analyzing your marine biodiversity samples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button className="hover-elevate" data-testid="button-upload-sample">
              <Upload className="h-4 w-4 mr-2" />
              Upload Sample
            </Button>
            <Button variant="outline" className="hover-elevate" data-testid="button-view-map">
              <MapPin className="h-4 w-4 mr-2" />
              View Hotspot Map
            </Button>
            <Button variant="outline" className="hover-elevate" data-testid="button-generate-prediction">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Prediction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}