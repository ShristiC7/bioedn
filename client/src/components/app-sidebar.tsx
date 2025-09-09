import { Home, Map, Upload, AlertTriangle, TrendingUp, Users, Settings, Search, Activity, FileText } from "lucide-react";
import { SiLeaflet } from "react-icons/si";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { Link } from "wouter";

// Menu items for the biodiversity analytics platform
const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Overview and key metrics"
  },
  {
    title: "Interactive Map",
    url: "/map",
    icon: Map,
    description: "Real-time biodiversity hotspots"
  },
  {
    title: "Sample Upload",
    url: "/upload",
    icon: Upload,
    description: "Upload eDNA samples"
  },
  {
    title: "File Converter",
    url: "/converter",
    icon: FileText,
    description: "Convert .tar.gz to .fasta"
  },
  {
    title: "Species Alerts",
    url: "/alerts",
    icon: AlertTriangle,
    description: "Endangered & invasive species"
  },
  {
    title: "AI Predictions",
    url: "/predictions",
    icon: TrendingUp,
    description: "Biodiversity trend forecasts"
  },
  {
    title: "Citizen Science",
    url: "/citizens",
    icon: Users,
    description: "Community contributions"
  },
  {
    title: "Live Activity",
    url: "/activity",
    icon: Activity,
    description: "Real-time system updates"
  },
  {
    title: "Species Database",
    url: "/species",
    icon: Search,
    description: "Browse species catalog"
  },
];

export function AppSidebar() {
  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <SiLeaflet className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">BioDiversity</h1>
            <p className="text-xs text-muted-foreground">Analytics Platform</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}