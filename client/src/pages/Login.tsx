import { useState } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/LoginForm";

interface LoginProps {
  onLogin?: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    // Simulate login delay - todo: remove mock functionality
    setTimeout(() => {
      console.log('Login successful:', { email });
      onLogin?.({ email, name: email.split('@')[0] });
      setLocation('/devices');
      setLoading(false);
    }, 1000);
  };

  const handleOIDCLogin = async (provider: string) => {
    setLoading(true);
    setError("");

    // Simulate OIDC flow - todo: remove mock functionality
    setTimeout(() => {
      console.log('OIDC login successful:', { provider });
      onLogin?.({ email: `user@${provider}.com`, name: 'Demo User', provider });
      setLocation('/devices');
      setLoading(false);
    }, 1500);
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      onOIDCLogin={handleOIDCLogin}
      loading={loading}
      error={error}
    />
  );
}