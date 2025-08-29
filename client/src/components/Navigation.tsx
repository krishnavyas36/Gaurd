import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, User, Filter } from "lucide-react";
import WalletGydeLogo from "@/components/WalletGydeLogo";

interface NavigationProps {
  activeAlertCount?: number;
  isConnected?: boolean;
}

export default function Navigation({ activeAlertCount = 0, isConnected = false }: NavigationProps) {
  return (
    <header className="bg-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <WalletGydeLogo variant="light" data-testid="logo" />
              <h1 className="text-xl font-semibold text-white" data-testid="app-title">
                WalletGyde Security Agent
              </h1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-1 ml-8">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-white hover:bg-slate-700"
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/compliance">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-white hover:bg-slate-700"
                  data-testid="nav-compliance"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Compliance Filtering
                </Button>
              </Link>
              <Link href="/plaid-demo">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-white hover:bg-slate-700"
                  data-testid="nav-plaid-demo"
                >
                  Plaid Integration
                </Button>
              </Link>
              <Link href="/llm-testing">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-white hover:bg-slate-700"
                  data-testid="nav-llm-testing"
                >
                  LLM Risk Control
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Alert Counter */}
            <div className="relative">
              <button 
                className="p-2 text-gray-300 hover:text-white transition-colors" 
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                {activeAlertCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    data-testid="text-alert-count"
                  >
                    {activeAlertCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
              <span className="text-sm font-medium text-gray-200" data-testid="text-username">
                Security Admin
              </span>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-300" data-testid="text-connection-status">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}