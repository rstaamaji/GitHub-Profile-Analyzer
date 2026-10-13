import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  BarChart3,
  GitCompare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavigationTab } from '../../types/github';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  reposCount?: number;
  hasUserLoaded?: boolean;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  statusNote?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  reposCount,
  hasUserLoaded = false,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'repositories',
      label: 'Repositories',
      icon: FolderGit2,
      badge: hasUserLoaded && typeof reposCount === 'number' ? reposCount : undefined,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'compare',
      label: 'Compare',
      icon: GitCompare,
    },
  ];

  return (
    <nav
      aria-label="Application sections"
      className="w-full border-b border-[#30363d] bg-[#0d1117]/60 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Horizontal scrollable row for mobile & tablet */}
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex items-center gap-1 sm:gap-2 -mb-px overflow-x-auto no-scrollbar py-2 sm:py-0"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(item.id)}
                type="button"
                className={`group inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer select-none whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] rounded-t-md ${
                  isActive
                    ? 'border-emerald-500 text-neutral-100 bg-[#161b22]/40'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-[#30363d] hover:bg-[#161b22]/20'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-neutral-500 group-hover:text-neutral-300'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>

                {/* Counter Badge if available */}
                {item.badge !== undefined && (
                  <span
                    aria-label={`${item.badge} repositories`}
                    className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-mono bg-[#21262d] text-neutral-300 border border-[#30363d]"
                  >
                    {item.badge}
                  </span>
                )}

                {/* Status indicator for in-progress sections */}
                {item.statusNote && (
                  <span className="hidden md:inline-block ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono tracking-wider uppercase bg-[#21262d] text-neutral-400 border border-[#30363d]">
                    {item.statusNote}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
