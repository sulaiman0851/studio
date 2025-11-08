
"use client";

import { Lightbulb, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { Job } from "@/lib/types";
import { getAiSuggestionAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AiSuggestionBox() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getValues } = useFormContext<Job>();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    const values = getValues();
    const input = {
      jobType: values.jobType,
      customerName: values.customerName,
      equipmentType: values.equipment.type,
      serialNumber: values.equipment.serialNumber,
      powerRx: values.equipment.powerRx,
      pppoeUsername: values.network?.pppoeUsername,
      pppoePassword: values.network?.pppoePassword,
      ssid: values.network?.newSsid,
      wlanKey: values.network?.wlanKey,
      reason: values.reason,
    };
    
    const result = await getAiSuggestionAction(input);

    if (result.success) {
      setSuggestions(result.suggestions);
    } else {
      setError(result.error || "An unknown error occurred.");
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">AI Suggestion Helper</CardTitle>
        <Button onClick={handleGetSuggestions} disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Get Tips
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Generating suggestions...</p>
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {suggestions.length > 0 && (
          <div className="space-y-2 text-sm">
            <h4 className="font-medium">Here are some suggestions for this job:</h4>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
         {!isLoading && !error && suggestions.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">Click "Get Tips" for AI-powered efficiency suggestions based on the current job details.</p>
        )}
      </CardContent>
    </Card>
  );
}
