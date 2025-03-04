import { useEffect, useRef } from "react";
import * as ve from "@vscode-elements/elements";

export function useCollapsibleToggle(onToggle: (open: boolean) => void) {
  const collapsibleRef = useRef<ve.VscodeCollapsible | null>(null);

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
