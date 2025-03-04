import { useEffect, useRef } from "react";

export function useCollapsibleToggle(onToggle: (open: boolean) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents
  const collapsibleRef = useRef<any | null>(null);

  useEffect(() => {
    if (!collapsibleRef.current) return;
    const collapsibleElement = collapsibleRef.current as HTMLElement;

    function handleToggle(event: { detail: { open: boolean } }) {
      onToggle(event.detail.open);
    }

    collapsibleElement.addEventListener("vsc-collapsible-toggle", handleToggle);
    return () => {
      collapsibleElement.removeEventListener("vsc-collapsible-toggle", handleToggle);
    };
  }, [onToggle]);

  return collapsibleRef;
}
