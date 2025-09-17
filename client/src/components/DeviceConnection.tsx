import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useDevices } from "@/hooks/useDevices";
import { useAuth } from "@/hooks/useAuth";
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Search, 
  RefreshCw, 
  Settings, 
  Zap,
  HardDrive,
  Thermometer
} from "lucide-react";

interface DeviceConnectionProps {
  onConnect?: (deviceId: string) => Promise<void>;
  onDisconnect?: (deviceId: string) => Promise<void>;
}

export function DeviceConnection({ onConnect, onDisconnect }: DeviceConnectionProps) {
  const [manualIP, setManualIP] = useState("");
  const { isAuthenticated } = useAuth();
  const { 
    devices, 
    loading, 
    scanning, 
    scanDevices, 
    connectDevice, 
    disconnectDevice 
  } = useDevices(isAuthenticated);

  const handleScan = async () => {
    await scanDevices();
  };

  const handleConnect = async (deviceId: string) => {
    await connectDevice(deviceId);
    await onConnect?.(deviceId);
  };

  const handleDisconnect = async (deviceId: string) => {
    await disconnectDevice(deviceId);
    await onDisconnect?.(deviceId);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'raspberry-pi': return '🔴';
      case 'jetson': return '🟢';
      case 'coral': return '🟡';
      case 'ncs': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Device Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleScan}
              disabled={scanning}
              className="gap-2"
              data-testid="button-scan-devices"
            >
              <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Network'}
            </Button>
            <Button variant="outline" data-testid="button-refresh-devices">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="manual-ip">Connect by IP Address</Label>
            <div className="flex gap-2">
              <Input
                id="manual-ip"
                placeholder="192.168.1.100"
                value={manualIP}
                onChange={(e) => setManualIP(e.target.value)}
                data-testid="input-manual-ip"
              />
              <Button 
                variant="outline"
                onClick={() => console.log(`Connecting to ${manualIP}`)}
                data-testid="button-connect-manual"
              >
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Devices</h3>
        
        {devices.length === 0 && (
          <Alert>
            <AlertDescription>
              No devices found. Make sure your edge devices are powered on and connected to the same network.
            </AlertDescription>
          </Alert>
        )}
        
        {devices.map((device) => (
          <Card key={device.id} className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getDeviceIcon(device.type)}</div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {device.name}
                      <Badge 
                        variant={device.status === 'connected' ? 'default' : 'secondary'}
                        className="gap-1"
                        data-testid={`status-device-${device.id}`}
                      >
                        {device.status === 'connected' ? (
                          <>
                            <Wifi className="h-3 w-3" />
                            Connected
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3" />
                            {device.status === 'connecting' ? 'Connecting...' : 'Disconnected'}
                          </>
                        )}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">{device.ip}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {device.status === 'connected' ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnect(device.id)}
                        data-testid={`button-disconnect-${device.id}`}
                      >
                        Disconnect
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-settings-${device.id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(device.id)}
                      size="sm"
                      data-testid={`button-connect-${device.id}`}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Device Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">CPU:</span>
                  <span>{device.specs.cpu}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">RAM:</span>
                  <span>{device.specs.memory}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Temp:</span>
                  <span>{device.specs.temperature}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Usage:</span>
                  <span>{device.specs.usage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}