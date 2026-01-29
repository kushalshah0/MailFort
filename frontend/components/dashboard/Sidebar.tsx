"use client";

import { Inbox, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

type FilterType = "all" | "phishing" | "safe";

interface SidebarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  emailCounts: {
    all: number;
    phishing: number;
    safe: number;
  };
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ 
  filter, 
  onFilterChange, 
  emailCounts,
  collapsed: controlledCollapsed,
  onCollapsedChange
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  const primaryFolders = [
    {
      id: "all" as FilterType,
      label: "Inbox",
      icon: Inbox,
      count: emailCounts.all,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "phishing" as FilterType,
      label: "Phishing",
      icon: AlertTriangle,
      count: emailCounts.phishing,
      color: "text-red-600 dark:text-red-400",
    },
    {
      id: "safe" as FilterType,
      label: "Safe",
      icon: ShieldCheck,
      count: emailCounts.safe,
      color: "text-green-600 dark:text-green-400",
    },
  ];


  return (
    <aside 
      className={cn(
        "relative bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Primary Folders */}
        <div className="space-y-1">
          {!collapsed && (
            <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Folders
            </h3>
          )}
          {primaryFolders.map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full transition-all",
                  collapsed ? "justify-center px-2" : "justify-start",
                  isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                )}
                onClick={() => onFilterChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5", collapsed ? "" : "mr-3", item.color)} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count > 0 && (
                      <Badge 
                        variant={isActive ? "default" : "secondary"}
                        className="ml-auto"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </div>

      </ScrollArea>
    </aside>
  );
}
