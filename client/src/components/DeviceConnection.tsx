import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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

interface Device {
  id: string;
  name: string;
  type: "raspberry-pi" | "jetson" | "coral" | "ncs";
  status: "connected" | "disconnected" | "connecting";
  ip: string;
  specs: {
    cpu: string;
    memory: string;
    temperature: number;
    usage: number;
  };
}

interface DeviceConnectionProps {
  onConnect?: (deviceId: string) => void;
  onDisconnect?: (deviceId: string) => void;
}

export function DeviceConnection({ onConnect, onDisconnect }: DeviceConnectionProps) {
  const [scanning, setScanning] = useState(false);
  const [manualIP, setManualIP] = useState("");
  
  // Mock device data - todo: remove mock functionality
  const [devices] = useState<Device[]>([
    {
      id: "rpi-001",
      name: "Raspberry Pi 4B",
      type: "raspberry-pi",
      status: "disconnected",
      ip: "192.168.1.100",
      specs: {
        cpu: "ARM Cortex-A72",
        memory: "4GB RAM",
        temperature: 45,
        usage: 23
      }
    },
    {
      id: "jetson-001", 
      name: "NVIDIA Jetson Nano",
      type: "jetson",
      status: "connected",
      ip: "192.168.1.101",
      specs: {
        cpu: "ARM Cortex-A57",
        memory: "4GB RAM",
        temperature: 52,
        usage: 67
      }
    },
    {
      id: "coral-001",
      name: "Google Coral Dev Board",
      type: "coral", 
      status: "disconnected",
      ip: "192.168.1.102",
      specs: {
        cpu: "ARM Cortex-A53",
        memory: "1GB RAM",
        temperature: 38,
        usage: 12
      }
    }
  ]);

  const handleScan = async () => {
    setScanning(true);
    console.log('Scanning for devices...');
    // todo: remove mock functionality - simulate scanning delay
    setTimeout(() => {
      setScanning(false);
      console.log('Scan completed');
    }, 2000);
  };

  const handleConnect = (deviceId: string) => {
    console.log(`Connecting to device ${deviceId}...`);
    onConnect?.(deviceId);
  };

  const handleDisconnect = (deviceId: string) => {
    console.log(`Disconnecting from device ${deviceId}...`);
    onDisconnect?.(deviceId);
  };

  const getDeviceIcon = (type: Device['type']) => {
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