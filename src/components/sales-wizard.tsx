"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  Share2,
  FileText,
  Megaphone,
  Check,
  ChevronRight,
  ChevronLeft,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MarketAnalysis } from "@/components/market-analysis";
import { ProfileConfigurator } from "@/components/profile-configurator";
import { ListingEditor } from "@/components/listing-editor";
import { ListingPublish } from "@/components/listing-publish";
import type { VehicleListing, PlatformEntry } from "@/lib/validations/listing";

const STEPS = [
  { id: 1, label: "Marktpreis", icon: TrendingUp },
  { id: 2, label: "Kurzprofil", icon: Share2 },
  { id: 3, label: "Inserat", icon: FileText },
  { id: 4, label: "Veröffentlichen", icon: Megaphone },
] as const;

interface StepCompletion {
  hasMarketAnalysis: boolean;
  hasProfile: boolean;
  hasListing: boolean;
  hasPublished: boolean;
}

interface SalesWizardProps {
  vehicleId: string;
  // Step 1: MarketAnalysis props
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleFactoryCode: string | null;
  vehicleMileageKm: number | null;
  // Step 2: ProfileConfigurator props
  images: { id: string; storage_path: string; position: number }[];
  serviceEntries: { id: string; description: string; service_date: string }[];
  milestones: { id: string; title: string; milestone_date: string }[];
  documents: { id: string; title: string; category: string }[];
  // Step 3: ListingEditor props
  vehicleData: {
    make: string;
    model: string;
    year: number;
    factory_code: string | null;
    color: string | null;
    engine_type: string | null;
    displacement_ccm: number | null;
    horsepower: number | null;
    mileage_km: number | null;
  };
  photos: {
    id: string;
    storage_path: string;
    label: string;
    source: "vehicle" | "milestone";
  }[];
  hasKurzprofil: boolean;
  kurzprofilToken: string | null;
  marketPrice: {
    recommended_price_low: number | null;
    recommended_price_high: number | null;
    median_price: number | null;
  } | null;
  // Initial completion state (derived from DB on server)
  initialCompletion: StepCompletion;
}

export function SalesWizard({
  vehicleId,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  vehicleFactoryCode,
  vehicleMileageKm,
  images,
  serviceEntries,
  milestones,
  documents,
  vehicleData,
  photos,
  hasKurzprofil,
  kurzprofilToken,
  marketPrice,
  initialCompletion,
}: SalesWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const schritt = parseInt(searchParams.get("schritt") || "0", 10);
  const initialStep = schritt >= 1 && schritt <= 4 ? schritt : getDefaultStep(initialCompletion);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [highestReached, setHighestReached] = useState(
    Math.max(initialStep, getHighestCompleted(initialCompletion))
  );
  const [completion, setCompletion] = useState(initialCompletion);

  // Listing state for step 4 (publish)
  const [listing, setListing] = useState<VehicleListing | null>(null);

  const navigateToStep = useCallback(
    (step: number) => {
      setCurrentStep(step);
      setHighestReached((prev) => Math.max(prev, step));
      const url = `/vehicles/${vehicleId}/verkaufsassistent?schritt=${step}`;
      router.replace(url, { scroll: false });
    },
    [vehicleId, router]
  );

  const handleNext = () => {
    if (currentStep < 4) {
      navigateToStep(currentStep + 1);
    } else {
      router.push(`/vehicles/${vehicleId}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      navigateToStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleStepClick = (step: number) => {
    if (step <= highestReached || isStepCompleted(step, completion)) {
      navigateToStep(step);
    }
  };

  // Callback when listing is loaded/created in ListingEditor
  const handleListingReady = useCallback((l: VehicleListing) => {
    setListing(l);
    if (l.title) {
      setCompletion((prev) => ({ ...prev, hasListing: true }));
    }
  }, []);

  const handlePlatformUpdate = useCallback((platforms: PlatformEntry[]) => {
    if (listing) {
      setListing({ ...listing, published_platforms: platforms });
      if (platforms.some((p) => p.status === "aktiv")) {
        setCompletion((prev) => ({ ...prev, hasPublished: true }));
      }
    }
  }, [listing]);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = isStepCompleted(step.id, completion);
          const isReachable =
            step.id <= highestReached || isCompleted;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              {index > 0 && (
                <Separator className="w-4 sm:w-8 mx-0.5 sm:mx-1" />
              )}
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!isReachable && !isActive}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/15"
                    : isReachable
                    ? "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80"
                    : "bg-muted/40 text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.id}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <MarketAnalysis
            vehicleId={vehicleId}
            vehicleMake={vehicleMake}
            vehicleModel={vehicleModel}
            vehicleYear={vehicleYear}
            vehicleFactoryCode={vehicleFactoryCode}
            vehicleMileageKm={vehicleMileageKm}
          />
        )}

        {currentStep === 2 && (
          <ProfileConfigurator
            vehicleId={vehicleId}
            images={images}
            serviceEntries={serviceEntries}
            milestones={milestones}
            documents={documents}
          />
        )}

        {currentStep === 3 && (
          <ListingEditor
            vehicleId={vehicleId}
            vehicleData={vehicleData}
            photos={photos}
            hasKurzprofil={hasKurzprofil}
            kurzprofilToken={kurzprofilToken}
            marketPrice={marketPrice}
            onListingReady={handleListingReady}
            wizardMode
          />
        )}

        {currentStep === 4 && (
          listing ? (
            <ListingPublish
              listing={listing}
              vehicleId={vehicleId}
              onPlatformUpdate={handlePlatformUpdate}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">
                Erstelle zuerst ein Inserat in Schritt 3, bevor du es veröffentlichen kannst.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigateToStep(3)}
              >
                Zu Schritt 3: Inserat
              </Button>
            </div>
          )
        )}
      </div>

      {/* Wizard navigation */}
      <Separator />
      <div className="flex items-center justify-between pb-4">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep < 4 && (
            <Button variant="ghost" onClick={handleSkip}>
              Überspringen
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button onClick={handleNext}>
            {currentStep === 4 ? "Fertig" : "Weiter"}
            {currentStep < 4 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getDefaultStep(completion: StepCompletion): number {
  if (!completion.hasMarketAnalysis) return 1;
  if (!completion.hasProfile) return 2;
  if (!completion.hasListing) return 3;
  if (!completion.hasPublished) return 4;
  return 1;
}

function getHighestCompleted(completion: StepCompletion): number {
  if (completion.hasPublished) return 4;
  if (completion.hasListing) return 4;
  if (completion.hasProfile) return 3;
  if (completion.hasMarketAnalysis) return 2;
  return 1;
}

function isStepCompleted(step: number, completion: StepCompletion): boolean {
  switch (step) {
    case 1:
      return completion.hasMarketAnalysis;
    case 2:
      return completion.hasProfile;
    case 3:
      return completion.hasListing;
    case 4:
      return completion.hasPublished;
    default:
      return false;
  }
}
