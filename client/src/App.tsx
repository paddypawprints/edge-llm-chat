import { useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Devices from "@/pages/Devices";
import Chat from "@/pages/Chat";
import NotFound from "@/pages/not-found";

function Router() {
  const [user, setUser] = useState<any>(null);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);

  const handleLogin = (userData: any) => {
    console.log('User logged in:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    console.log('User logged out');
    setUser(null);
    setConnectedDevice(null);
  };

  const handleDeviceConnect = (deviceId: string) => {
    console.log('Device connected:', deviceId);
    setConnectedDevice(deviceId);
  };

  const handleDeviceDisconnect = (deviceId: string) => {
    console.log('Device disconnected:', deviceId);
    setConnectedDevice(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        isAuthenticated={!!user}
        deviceConnected={!!connectedDevice}
        onLogout={handleLogout}
      />
      
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login">
            <Login onLogin={handleLogin} />
          </Route>
          <Route path="/devices">
            {user ? (
              <Devices
                onDeviceConnect={handleDeviceConnect}
                onDeviceDisconnect={handleDeviceDisconnect}
              />
            ) : (
              <Login onLogin={handleLogin} />
            )}
          </Route>
          <Route path="/chat">
            {user ? (
              <Chat deviceConnected={!!connectedDevice} />
            ) : (
              <Login onLogin={handleLogin} />
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="system" storageKey="ir-theme">
          <Router />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;