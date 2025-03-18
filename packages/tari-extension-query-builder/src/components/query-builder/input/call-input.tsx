import { Label } from "@/components/ui/label";

export interface CallInputProps {
  name: string;
  labelWidth?: string;
  rowHeight?: string;
  children: React.ReactNode;
}

function CallInput({ name, labelWidth = "150px", rowHeight = "36px", children }: CallInputProps) {
  return (
    <div className="flex items-center mt-1" style={{ height: rowHeight }}>
      {name && (
        <Label
          htmlFor={name}
          style={{
            width: labelWidth,
            display: "inline-block",
            textAlign: "right",
          }}
        >
          {name}
        </Label>
      )}
      <div className={name ? "ml-2 w-[64ch]" : "w-full"}>{children}</div>
    </div>
  );
}

export default CallInput;
