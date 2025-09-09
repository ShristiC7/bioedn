import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Shield, 
  Fish, 
  Search, 
  MapPin, 
  Clock, 
  TrendingDown,
  TrendingUp,
  Info,
  Bell,
  Filter
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface SpeciesAlert {
  id: string;
  type: 'endangered' | 'invasive' | 'biodiversity_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  isRead: boolean;
  createdAt: string;
  detection?: {
    confidence: number;
    species: {
      scientificName: string;
      commonName?: string;
      conservationStatus?: string;
    };
  };
}

interface Species {
  id: string;
  scientificName: string;
  commonName?: string;
  category: string;
  conservationStatus?: string;
  isEndangered: boolean;
  isInvasive: boolean;
  description?: string;
}

export default function SpeciesAlerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  
  const { data: alerts, isLoading: alertsLoading } = useQuery<SpeciesAlert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const { data: endangeredSpecies } = useQuery<Species[]>({
    queryKey: ['/api/species/endangered']
  });

  const { data: invasiveSpecies } = useQuery<Species[]>({
    queryKey: ['/api/species/invasive']
  });

  // Real-time WebSocket for new alerts
  const { isConnected, lastMessage } = useWebSocket();

  // Filter alerts based on search and filters
  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = !searchTerm || 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'endangered': return <Shield className="h-4 w-4 text-red-500" />;
      case 'invasive': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'biodiversity_change': return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (alertsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading species alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8" data-testid="species-alerts-main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Species Conservation Alerts</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of endangered and invasive species detections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Real-time Active' : 'Offline'}
            </span>
          </div>
          <Badge variant="outline" className="text-red-600 border-red-200">
            <Bell className="h-3 w-3 mr-1" />
            {filteredAlerts.filter(a => !a.isRead).length} Unread
          </Badge>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredAlerts.filter(a => a.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endangered Species</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredAlerts.filter(a => a.type === 'endangered').length}
            </div>
            <p className="text-xs text-muted-foreground">Conservation priority species</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invasive Species</CardTitle>
            <Fish className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredAlerts.filter(a => a.type === 'invasive').length}
            </div>
            <p className="text-xs text-muted-foreground">Ecosystem threats detected</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Monitoring</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">Real-time alert system</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active-alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="endangered" data-testid="tab-endangered">Endangered Species</TabsTrigger>
            <TabsTrigger value="invasive" data-testid="tab-invasive">Invasive Species</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-alert-history">Alert History</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-alerts"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40" data-testid="select-alert-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="endangered">Endangered</SelectItem>
                <SelectItem value="invasive">Invasive</SelectItem>
                <SelectItem value="biodiversity_change">Biodiversity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40" data-testid="select-alert-severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Conservation Alerts
              </CardTitle>
              <CardDescription>
                Current threats and conservation priorities requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                    <p>All marine ecosystems are within normal parameters</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`relative p-4 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
                        alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                        alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                        'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      } hover-elevate`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getTypeIcon(alert.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{alert.message}</h4>
                              {!alert.isRead && (
                                <div className={`h-2 w-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                              )}
                            </div>
                            
                            {alert.detection && (
                              <div className="text-sm text-muted-foreground">
                                <strong>{alert.detection.species.scientificName}</strong>
                                {alert.detection.species.commonName && (
                                  <span> ({alert.detection.species.commonName})</span>
                                )}
                                <span className="ml-2">
                                  Confidence: {(alert.detection.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {alert.location.name || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(alert.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline" data-testid={`button-view-${alert.id}`}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endangered" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Endangered Species Watchlist
              </CardTitle>
              <CardDescription>
                High-priority species requiring conservation protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {endangeredSpecies?.map((species) => (
                  <div key={species.id} className="p-4 border rounded-lg hover-elevate">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-medium">{species.scientificName}</h3>
                        {species.commonName && (
                          <p className="text-sm text-muted-foreground">{species.commonName}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {species.conservationStatus}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {species.category}
                          </Badge>
                        </div>
                        {species.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {species.description}
                          </p>
                        )}
                      </div>
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    </div>
                  </div>
                )) || (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No endangered species data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invasive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-orange-500" />
                Invasive Species Monitoring
              </CardTitle>
              <CardDescription>
                Non-native species that pose threats to marine ecosystems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {invasiveSpecies?.map((species) => (
                  <div key={species.id} className="p-4 border rounded-lg hover-elevate">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-medium">{species.scientificName}</h3>
                        {species.commonName && (
                          <p className="text-sm text-muted-foreground">{species.commonName}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            Invasive
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {species.category}
                          </Badge>
                        </div>
                        {species.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {species.description}
                          </p>
                        )}
                      </div>
                      <Fish className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    </div>
                  </div>
                )) || (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No invasive species data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Alert History
              </CardTitle>
              <CardDescription>
                Historical conservation alerts and resolved issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Alert History</h3>
                <p>Historical alerts and trends will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}