import { Checkbox } from "@/components/ui/checkbox";
import CallInput, { CallInputProps } from "./call-input";
import { useState } from "react";
import { SafeParseReturnType } from "zod";
import { CheckedState } from "@radix-ui/react-checkbox";

interface CallInputCheckboxProps extends Omit<CallInputProps, "children"> {
  value?: SafeParseReturnType<unknown, unknown>;
  onChange?: (value: SafeParseReturnType<unknown, unknown>) => void;
}

function CallInputCheckbox({ name, labelWidth, value, onChange }: CallInputCheckboxProps) {
  const [checked, setChecked] = useState(value?.success ? (value.data as boolean) : false);

  const handleChange = (checkedState: CheckedState) => {
    const checked = typeof checkedState === "boolean" && checkedState;
    setChecked(checked);
    if (onChange) {
      onChange({ success: true, data: checked });
    }
  };

  return (
    <CallInput name={name} labelWidth={labelWidth}>
      <Checkbox
        name={name}
        className="nodrag flex justify-start border border-gray-400 dark:border-gray-700"
        checked={checked}
        onCheckedChange={handleChange}
      />
    </CallInput>
  );
}

export default CallInputCheckbox;
