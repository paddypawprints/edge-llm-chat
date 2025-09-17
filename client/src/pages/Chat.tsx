import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { CameraCapture } from "@/components/CameraCapture";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ChatProps {
  deviceConnected?: boolean;
}

export default function Chat({ deviceConnected = false }: ChatProps) {
  const [debugMode, setDebugMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleSendMessage = (message: string, images?: File[]) => {
    // todo: remove mock functionality - simulate sending to edge device
    console.log('Sending to edge device:', {
      message,
      imageCount: images?.length || 0,
      debugMode
    });
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleCameraCapture = (imageFile: File) => {
    console.log('Photo captured:', imageFile.name);
    // todo: remove mock functionality - add to chat automatically
    setShowCamera(false);
  };

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Chat</h1>
        <p className="text-muted-foreground">
          Chat with your AI models running on connected edge devices.
        </p>
      </div>
      
      <div className="flex-1 bg-card rounded-lg border overflow-hidden">
        <ChatInterface
          deviceConnected={deviceConnected}
          debugMode={debugMode}
          onToggleDebug={() => setDebugMode(!debugMode)}
          onSendMessage={handleSendMessage}
          onTakePhoto={handleTakePhoto}
        />
      </div>

      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-3xl">
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}