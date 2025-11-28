import { Home, Upload, ClipboardList, History, TrendingUp, MessageCircle, AlertTriangle, Building2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Upload Report",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Assessment",
    url: "/assessment",
    icon: ClipboardList,
  },
  {
    title: "AI Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "SOS",
    url: "/sos",
    icon: AlertTriangle,
  },
  {
    title: "Hospitals",
    url: "/hospitals",
    icon: Building2,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
  {
    title: "Tracking",
    url: "/tracking",
    icon: TrendingUp,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-center px-3 py-4 mb-2">
          <img 
            src="/logo.jpeg" 
            alt="HER metrix Logo" 
            className="h-20 w-20 object-contain"
            data-testid="logo-sidebar"
          />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-3 mb-2 text-center">
            HER metrix
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
