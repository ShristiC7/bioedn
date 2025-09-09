import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Map, 
  MapPin, 
  Filter, 
  Layers, 
  Search, 
  AlertTriangle, 
  Fish, 
  Activity,
  Zap
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Hotspot {
  id: string;
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  speciesCount: number;
  samplesCount: number;
  type: 'high' | 'medium' | 'low' | 'alert';
  alerts?: number;
  lastUpdated: string;
  biodiversityIndex?: number;
}

interface MapLayers {
  hotspots: boolean;
  samples: boolean;
  alerts: boolean;
  bathymetry: boolean;
}

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    hotspots: true,
    samples: true,
    alerts: true,
    bathymetry: false
  });
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - in production this would come from API
  const mockHotspots: Hotspot[] = [
    {
      id: "1",
      location: { lat: 25.7617, lng: -80.1918, name: "Miami Reef System" },
      speciesCount: 147,
      samplesCount: 23,
      type: "high",
      alerts: 2,
      lastUpdated: new Date().toISOString(),
      biodiversityIndex: 85
    },
    {
      id: "2", 
      location: { lat: 24.5557, lng: -81.7826, name: "Key Largo Marine Sanctuary" },
      speciesCount: 203,
      samplesCount: 41,
      type: "high",
      alerts: 0,
      lastUpdated: new Date().toISOString(),
      biodiversityIndex: 92
    },
    {
      id: "3",
      location: { lat: 26.1224, lng: -80.1373, name: "Fort Lauderdale Coastal Waters" },
      speciesCount: 89,
      samplesCount: 15,
      type: "alert",
      alerts: 5,
      lastUpdated: new Date().toISOString(),
      biodiversityIndex: 62
    },
    {
      id: "4",
      location: { lat: 27.7663, lng: -82.6404, name: "Tampa Bay Marine Reserve" },
      speciesCount: 134,
      samplesCount: 28,
      type: "medium",
      alerts: 1,
      lastUpdated: new Date().toISOString(),
      biodiversityIndex: 78
    },
  ];

  const { data: recentActivity } = useQuery({
    queryKey: ['/api/live/activity'],
    refetchInterval: 10000
  });

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([25.7617, -80.1918], 8);
      
      // Add base map layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add markers layer group
      markersRef.current.addTo(map);
      
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (mapInstanceRef.current && markersRef.current) {
      markersRef.current.clearLayers();

      const filteredHotspots = mockHotspots.filter(hotspot => {
        if (filterType !== "all" && hotspot.type !== filterType) return false;
        if (searchQuery && !hotspot.location.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });

      filteredHotspots.forEach((hotspot) => {
        const getMarkerColor = (type: string) => {
          switch (type) {
            case 'high': return '#10B981'; // Green
            case 'medium': return '#F59E0B'; // Yellow
            case 'alert': return '#EF4444'; // Red
            default: return '#6B7280'; // Gray
          }
        };

        const icon = L.divIcon({
          html: `
            <div style="
              background-color: ${getMarkerColor(hotspot.type)};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
            ">
              ${hotspot.alerts ? '!' : '●'}
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([hotspot.location.lat, hotspot.location.lng], { icon })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-sm">${hotspot.location.name}</h3>
              <p class="text-xs text-gray-600">Species: ${hotspot.speciesCount}</p>
              <p class="text-xs text-gray-600">Samples: ${hotspot.samplesCount}</p>
              <p class="text-xs text-gray-600">Index: ${hotspot.biodiversityIndex}</p>
              ${hotspot.alerts ? `<p class="text-xs text-red-600">${hotspot.alerts} alerts</p>` : ''}
            </div>
          `)
          .on('click', () => setSelectedHotspot(hotspot));

        markersRef.current.addLayer(marker);
      });
    }
  }, [filterType, searchQuery, mapLayers]);

  const toggleLayer = (layer: keyof MapLayers) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-4" data-testid="interactive-map-main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Interactive Biodiversity Map</h2>
          <p className="text-muted-foreground">
            Real-time marine ecosystem hotspots and live tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <Activity className="h-3 w-3 mr-1" />
            Live Tracking Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Map Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-map-search"
              />
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="select-hotspot-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hotspots</SelectItem>
                  <SelectItem value="high">High Biodiversity</SelectItem>
                  <SelectItem value="medium">Medium Biodiversity</SelectItem>
                  <SelectItem value="alert">Alert Zones</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(mapLayers).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Button
                    size="sm"
                    variant={enabled ? "default" : "outline"}
                    onClick={() => toggleLayer(key as keyof MapLayers)}
                    data-testid={`button-layer-${key}`}
                  >
                    {enabled ? "On" : "Off"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedHotspot && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Selected Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-medium">{selectedHotspot.location.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedHotspot.location.lat.toFixed(4)}, {selectedHotspot.location.lng.toFixed(4)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Species:</span>
                    <div className="font-medium">{selectedHotspot.speciesCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Samples:</span>
                    <div className="font-medium">{selectedHotspot.samplesCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Index:</span>
                    <div className="font-medium">{selectedHotspot.biodiversityIndex}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Alerts:</span>
                    <div className="font-medium text-destructive">{selectedHotspot.alerts || 0}</div>
                  </div>
                </div>

                <Badge 
                  variant={selectedHotspot.type === 'alert' ? 'destructive' : 'default'}
                  className="w-full justify-center"
                >
                  {selectedHotspot.type === 'high' && 'High Biodiversity'}
                  {selectedHotspot.type === 'medium' && 'Medium Biodiversity'}
                  {selectedHotspot.type === 'low' && 'Low Biodiversity'}
                  {selectedHotspot.type === 'alert' && 'Alert Zone'}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Map */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Real-time Marine Biodiversity Hotspots
              </CardTitle>
              <CardDescription>
                Live tracking of eDNA sample locations and species diversity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div 
                ref={mapRef} 
                className="w-full h-[500px] rounded-md map-container"
                data-testid="biodiversity-map"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Location Activity
          </CardTitle>
          <CardDescription>
            Real-time updates from monitoring locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList>
              <TabsTrigger value="recent" data-testid="tab-recent-activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="alerts" data-testid="tab-location-alerts">Location Alerts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-3">
              {recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-md border hover-elevate">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.type === 'detection' ? 'bg-green-500' : 
                    activity.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {activity.type}
                  </Badge>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-8">
                  No recent location activity
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="alerts" className="space-y-3">
              {mockHotspots.filter(h => h.alerts && h.alerts > 0).map((hotspot, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-md border border-destructive/20 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{hotspot.location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hotspot.alerts} active conservation alerts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Biodiversity Index: {hotspot.biodiversityIndex}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Alert Zone
                  </Badge>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-8">
                  No location alerts
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}