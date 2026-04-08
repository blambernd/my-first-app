"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Share2, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProfileStatusToggleProps {
  vehicleId: string;
}

export function ProfileStatusToggle({ vehicleId }: ProfileStatusToggleProps) {
  const [isActive, setIsActive] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/profile`);
      const data = await res.json();
      if (data.profile) {
        setHasProfile(true);
        setIsActive(data.profile.is_active);
        setToken(data.profile.token);
      }
    } catch {
      // Silently fail — profile may not exist yet
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggle = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsActive(data.profile.is_active);
      toast.success(
        data.profile.is_active ? "Kurzprofil aktiviert" : "Kurzprofil deaktiviert"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!token) return;
    const url = `${window.location.origin}/profil/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !hasProfile) return null;

  const profileUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/profil/${token}`
    : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 text-xs"
        >
          <Share2 className="h-3.5 w-3.5 mr-1" />
          Kurzprofil
          <span
            className={`ml-1.5 h-2 w-2 rounded-full ${
              isActive ? "bg-green-500" : "bg-muted-foreground/30"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Kurzprofil</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isActive ? "Aktiv" : "Inaktiv"}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={saving}
              />
            </div>
          </div>
          {token && (
            <div className="flex items-center gap-1.5">
              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                {profileUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                asChild
              >
                <a
                  href={`/profil/${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
          {!isActive && (
            <p className="text-xs text-muted-foreground">
              Der Link zeigt &quot;Nicht verfügbar&quot; solange das Profil
              deaktiviert ist.
            </p>
          )}
          {saving && (
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
