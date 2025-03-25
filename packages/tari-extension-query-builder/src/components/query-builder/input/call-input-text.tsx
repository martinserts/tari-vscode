import { Input } from "@/components/ui/input";
import CallInput, { CallInputProps } from "./call-input";
import { ChangeEvent, HTMLInputTypeAttribute, SyntheticEvent, useState } from "react";
import { SafeParseReturnType } from "zod";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface CallInputTextProps extends Omit<CallInputProps, "children"> {
  readOnly?: boolean;
  type?: HTMLInputTypeAttribute;
  placeHolder?: string;
  min?: string;
  max?: string;
  validate?: (data: string) => SafeParseReturnType<unknown, unknown>;
  value?: SafeParseReturnType<unknown, unknown>;
  onChange?: (value: SafeParseReturnType<unknown, unknown>) => void;
}

function CallInputText({
  readOnly = false,
  name,
  label,
  labelWidth,
  placeHolder,
  type,
  min,
  max,
  validate,
  value,
  onChange,
  rowHeight,
}: CallInputTextProps) {
  const [text, setText] = useState(value?.success ? String(value.data) : "");
  const errorMessage = !value?.success ? value?.error.errors[0].message : undefined;

  const handleOnInput = (event: SyntheticEvent<HTMLInputElement>) => {
    const inputElement = event.target as HTMLInputElement;
    setText(inputElement.value);
  };

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (validate && onChange) {
      const result = validate(event.target.value);
      onChange(result);
    }
  };

  return (
    <CallInput name={name} label={label} labelWidth={labelWidth} rowHeight={rowHeight}>
      <TooltipProvider>
        <Tooltip open={!!errorMessage}>
          <TooltipTrigger asChild>
            <Input
              readOnly={readOnly}
              name={name}
              type={type}
              autoComplete="off"
              placeholder={placeHolder}
              className={cn(
                "nodrag border",
                errorMessage
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 !ring-red-500"
                  : "border-gray-400 dark:border-gray-700",
              )}
              min={min}
              max={max}
              value={text}
              onInput={handleOnInput}
              onChange={handleOnChange}
            />
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="bg-red-500 text-white ml-5 p-2 rounded-md shadow-lg">
            {errorMessage}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CallInput>
  );
}

export default CallInputText;
