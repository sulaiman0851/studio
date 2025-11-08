
"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function SerialNumberInput() {
  const [isRevealed, setIsRevealed] = useState(false);
  const { control, watch } = useFormContext();
  
  const serialNumberValue = watch("equipment.serialNumber");

  const toggleReveal = () => setIsRevealed(!isRevealed);

  const maskedValue = (value: string) => {
    if (!value || value.length <= 8) return value;
    return `******${value.slice(-8)}`;
  };
  
  const displayValue = isRevealed ? serialNumberValue : maskedValue(serialNumberValue);

  return (
    <FormField
      control={control}
      name="equipment.serialNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Serial Number (SN)</FormLabel>
          <div className="relative">
            <FormControl>
              <Input 
                {...field}
                value={displayValue}
                onFocus={() => setIsRevealed(true)}
                onBlur={() => setIsRevealed(false)}
                onChange={(e) => {
                    // When user types, they should see the real value
                    if(!isRevealed) setIsRevealed(true);
                    field.onChange(e);
                }}
                placeholder="e.g., HWTC12345678" 
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
              onClick={toggleReveal}
              aria-label={isRevealed ? "Hide serial number" : "Show serial number"}
            >
              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
