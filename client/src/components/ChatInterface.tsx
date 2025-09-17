import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Image, 
  Camera, 
  Paperclip, 
  Bug, 
  User, 
  Bot,
  Upload,
  X
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  debug?: {
    systemPrompt?: string;
    modelInputs?: Record<string, any>;
    modelOutputs?: Record<string, any>;
    processingTime?: number;
  };
}

interface ChatInterfaceProps {
  deviceConnected?: boolean;
  debugMode?: boolean;
  onToggleDebug?: () => void;
  onSendMessage?: (message: string, images?: File[]) => void;
  onTakePhoto?: () => void;
}

export function ChatInterface({ 
  deviceConnected = false, 
  debugMode = false, 
  onToggleDebug, 
  onSendMessage,
  onTakePhoto 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mock messages - todo: remove mock functionality
  const [messages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm running on your edge device. How can I help you today?",
      timestamp: new Date(),
      debug: {
        systemPrompt: "You are a helpful AI assistant running on an edge device. Provide concise and accurate responses.",
        modelInputs: { temperature: 0.7, max_tokens: 150 },
        modelOutputs: { tokens_generated: 23, confidence: 0.94 },
        processingTime: 245
      }
    }
  ]);

  const handleSend = () => {
    if (!message.trim() && images.length === 0) return;
    
    console.log('Sending message:', { message, images: images.length });
    onSendMessage?.(message, images);
    
    setMessage("");
    setImages([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files.slice(0, 3 - prev.length)]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Edge AI Chat</h2>
          <Badge variant={deviceConnected ? "default" : "secondary"}>
            {deviceConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        
        <Button
          variant={debugMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleDebug}
          className="gap-2"
          data-testid="button-toggle-debug"
        >
          <Bug className="h-4 w-4" />
          Debug
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <Card className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {msg.images.map((img, idx) => (
                            <img key={idx} src={img} alt="Attached" className="h-20 w-20 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Debug Panel */}
              {debugMode && msg.debug && (
                <Card className="ml-8 bg-muted/50">
                  <CardContent className="p-3 text-xs font-mono">
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold">System Prompt:</span>
                        <p className="text-muted-foreground mt-1">{msg.debug.systemPrompt}</p>
                      </div>
                      
                      <div>
                        <span className="font-semibold">Model Inputs:</span>
                        <pre className="text-muted-foreground mt-1">
                          {JSON.stringify(msg.debug.modelInputs, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <span className="font-semibold">Model Outputs:</span>
                        <pre className="text-muted-foreground mt-1">
                          {JSON.stringify(msg.debug.modelOutputs, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <span className="font-semibold">Processing Time:</span>
                        <span className="text-muted-foreground ml-2">{msg.debug.processingTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t space-y-3">
        {/* Image Previews */}
        {images.length > 0 && (
          <div className="flex gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${index + 1}`}
                  className="h-16 w-16 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5"
                  onClick={() => removeImage(index)}
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder={deviceConnected 
                ? "Ask your edge AI anything..." 
                : "Connect to a device to start chatting..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!deviceConnected}
              className="min-h-[60px] pr-24"
              data-testid="textarea-message"
            />
            
            <div className="absolute right-2 top-2 flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
                data-testid="input-file-upload"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={!deviceConnected || images.length >= 3}
                data-testid="button-upload-image"
              >
                <Upload className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onTakePhoto}
                disabled={!deviceConnected}
                data-testid="button-take-photo"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!deviceConnected || (!message.trim() && images.length === 0)}
            className="self-end"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!deviceConnected && (
          <p className="text-xs text-muted-foreground text-center">
            Connect to an edge device to start chatting with your AI assistant
          </p>
        )}
      </div>
    </div>
  );
}