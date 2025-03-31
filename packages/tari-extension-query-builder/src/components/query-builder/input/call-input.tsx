import { Label } from "@/components/ui/label";
import { DotIcon } from "@radix-ui/react-icons";

export interface CallInputProps {
  name: string;
  label?: string;
  labelWidth?: string;
  rowHeight?: string;
  invalid?: boolean;
  children: React.ReactNode;
}

function CallInput({ name, label, labelWidth = "150px", rowHeight = "36px", invalid, children }: CallInputProps) {
  return (
    <div className="flex items-center mt-1" style={{ height: rowHeight }}>
      {name && (
        <Label
          htmlFor={name}
          style={{
            display: "inline-block",
            textAlign: "right",
            width: labelWidth,
          }}
        >
          <DotIcon className={`inline-block mr-1 text-red-500 ${invalid ? "opacity-100" : "opacity-0"}`} />
          {label ?? name}
        </Label>
      )}
      <div className={name ? "ml-2 w-[64ch]" : "w-full"}>{children}</div>
    </div>
  );
}

export default CallInput;
