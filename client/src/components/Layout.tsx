import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MailIcon, 
  DatabaseIcon, 
  BarChart3Icon, 
  SettingsIcon,
  MenuIcon,
  XIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  CodeIcon
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<any>;
  children?: NavigationItem[];
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['Jobs', 'XML Generators']));

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: BarChart3Icon },
    { name: 'Deals', href: '/deals', icon: DatabaseIcon },
    { 
      name: 'Jobs', 
      icon: BriefcaseIcon,
      children: [
        { name: 'Email extract', href: '/jobs', icon: MailIcon },
        { name: 'SFTP', href: '/sftp-jobs', icon: DatabaseIcon },
      ]
    },
    { 
      name: 'XML Generators', 
      icon: CodeIcon,
      children: [
        { name: 'Outlook', href: '/outlook-generator', icon: FileTextIcon },
        { name: 'SFTP', href: '/sftp-master-generator', icon: FileTextIcon },
      ]
    },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div 
            className="relative flex w-full max-w-xs flex-1 flex-col"
            style={{ backgroundColor: 'var(--color-sidebar)' }}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent 
              navigation={navigation} 
              isActive={isActive} 
              expandedSections={expandedSections} 
              toggleSection={toggleSection} 
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div 
          className="flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 pb-4"
          style={{ 
            backgroundColor: 'var(--color-sidebar)',
            borderColor: 'var(--color-border)'
          }}
        >
          <SidebarContent 
            navigation={navigation} 
            isActive={isActive} 
            expandedSections={expandedSections} 
            toggleSection={toggleSection} 
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <div 
          className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
          style={{ 
            backgroundColor: 'var(--color-topbar)',
            borderColor: 'var(--color-border)'
          }}
        >
          <button
            type="button"
            className="-m-2.5 p-2.5 lg:hidden"
            style={{ color: 'var(--color-text)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div 
            className="h-6 w-px lg:hidden" 
            style={{ backgroundColor: 'var(--color-border)' }}
          />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <h1 
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                File Routing Processor
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div 
                className="hidden lg:block lg:h-6 lg:w-px"
                style={{ backgroundColor: 'var(--color-border)' }}
              />
              <div 
                className="text-sm"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                Prototype v1.0
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

interface SidebarContentProps {
  navigation: NavigationItem[];
  isActive: (path: string) => boolean;
  expandedSections: Set<string>;
  toggleSection: (sectionName: string) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  navigation, 
  isActive, 
  expandedSections, 
  toggleSection 
}) => (
  <>
    <div className="flex h-16 shrink-0 items-center">
      <div className="flex items-center">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <MailIcon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-3">
          <div 
            className="text-lg font-bold"
            style={{ color: 'var(--color-sidebarText)' }}
          >
            FRP
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Management
          </div>
        </div>
      </div>
    </div>
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  // Section with children
                  <div>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold hover:opacity-80 transition-opacity"
                      style={{
                        color: 'var(--color-sidebarText)',
                      }}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        style={{ color: 'var(--color-textSecondary)' }}
                      />
                      <span className="flex-1 text-left">{item.name}</span>
                      {expandedSections.has(item.name) ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                    {expandedSections.has(item.name) && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.href!}
                              className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: isActive(child.href!) ? 'var(--color-highlight)' : 'transparent',
                                color: isActive(child.href!) ? 'var(--color-primary)' : 'var(--color-sidebarText)',
                              }}
                            >
                              <child.icon
                                className="h-5 w-5 shrink-0"
                                style={{
                                  color: isActive(child.href!) ? 'var(--color-primary)' : 'var(--color-textSecondary)'
                                }}
                              />
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Regular menu item
                  <Link
                    to={item.href!}
                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: isActive(item.href!) ? 'var(--color-highlight)' : 'transparent',
                      color: isActive(item.href!) ? 'var(--color-primary)' : 'var(--color-sidebarText)',
                    }}
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      style={{
                        color: isActive(item.href!) ? 'var(--color-primary)' : 'var(--color-textSecondary)'
                      }}
                    />
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  </>
);

export default Layout; 