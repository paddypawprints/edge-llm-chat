import { useState } from "react";
import { DeviceConnection } from "@/components/DeviceConnection";

interface DevicesProps {
  onDeviceConnect?: (deviceId: string) => void;
  onDeviceDisconnect?: (deviceId: string) => void;
}

export default function Devices({ onDeviceConnect, onDeviceDisconnect }: DevicesProps) {
  const handleConnect = (deviceId: string) => {
    console.log('Connecting to device:', deviceId);
    onDeviceConnect?.(deviceId);
  };

  const handleDisconnect = (deviceId: string) => {
    console.log('Disconnecting from device:', deviceId);
    onDeviceDisconnect?.(deviceId);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edge Devices</h1>
        <p className="text-muted-foreground">
          Connect to your edge devices to start chatting with AI models.
        </p>
      </div>
      
      <DeviceConnection
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}