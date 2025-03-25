import CallInput, { CallInputProps } from "./call-input";
import { useState } from "react";
import { SafeParseReturnType } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CallInputSelectProps extends Omit<CallInputProps, "children"> {
  readOnly?: boolean;
  choices: string[];
  validate?: (data: string) => SafeParseReturnType<unknown, unknown>;
  value?: SafeParseReturnType<unknown, unknown>;
  onChange?: (value: SafeParseReturnType<unknown, unknown>) => void;
}

function CallInputSelect({
  readOnly = false,
  name,
  label,
  labelWidth,
  choices,
  validate,
  value,
  onChange,
}: CallInputSelectProps) {
  const [selectedValue, setSelectedValue] = useState(value?.success ? (value.data as string) : "");
  const errorMessage = !value?.success ? value?.error.errors[0].message : undefined;

  const handleChange = (value: string) => {
    setSelectedValue(value);
    if (validate && onChange) {
      const result = validate(value);
      onChange(result);
    }
  };

  return (
    <CallInput name={name} label={label} labelWidth={labelWidth}>
      <TooltipProvider>
        <Tooltip open={!!errorMessage}>
          <TooltipTrigger asChild>
            <Select disabled={readOnly} name={name} value={selectedValue} onValueChange={handleChange}>
              <SelectTrigger
                className={cn(
                  "nodrag w-full border",
                  errorMessage
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 !ring-red-500"
                    : "border-gray-400 dark:border-gray-700",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="bg-red-500 text-white ml-5 p-2 rounded-md shadow-lg">
            {errorMessage}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CallInput>
  );
}

export default CallInputSelect;
