import { TariSigner } from "@tari-project/tarijs-all";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTariStore } from "../store/tari-store";
import {
  VscodeButton,
  VscodeCollapsible,
  VscodeDivider,
  VscodeFormContainer,
  VscodeFormGroup,
  VscodeIcon,
  VscodeLabel,
  VscodeProgressRing,
  VscodeTextfield,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonOutlineItem } from "tari-extension-common";
import { JsonDocument } from "../json-parser/JsonDocument";
import { JsonOutline } from "../json-parser/JsonOutline";
import { TEMPLATE_DETAILS_PARTS } from "../json-parser/known-parts/template-details";
import { useEnterKey } from "../hooks/textfield-enter";

interface TemplateActionsProps {
  signer: TariSigner;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function TemplateActions({ signer, open, onToggle }: TemplateActionsProps) {
  const newFlowRef = useRef<ve.VscodeIcon | null>(null);
  const messenger = useTariStore((state) => state.messenger);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateAddress, setTemplateAddress] = useState<string | null>(null);
  const templateAddressRef = useRef<ve.VscodeTextfield>(null);

  const collapsibleRef = useCollapsibleToggle(onToggle ?? (() => undefined));

  const handleItemSelect = async (item: JsonOutlineItem) => {
    if (messenger && jsonDocument) {
      await messenger.send("showJsonOutline", {
        id: jsonDocument.id,
        json: jsonDocument.jsonString,
        outlineItems,
        selected: item,
      });
    }
  };

  const handleAddNode = async (item: JsonOutlineItem) => {
    if (messenger && jsonDocument && templateAddress) {
      await messenger.send("addTariFlowNode", {
        template: jsonDocument.json as Record<string, unknown>,
        templateAddress,
        functionName: item.title,
      });
    }
  };

  const handleDragNode = (item: JsonOutlineItem) => {
    if (!jsonDocument || !templateAddress) {
      return null;
    }
    return {
      template: jsonDocument.json,
      templateAddress,
      functionName: item.title,
    };
  };

  const handleNewFlowClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (messenger) {
      messenger.send("newTariFlow", undefined).catch(console.log);
    }
  };

  useEffect(() => {
    if (!newFlowRef.current) return;
    const newFlowElement = newFlowRef.current as HTMLElement;

    newFlowElement.addEventListener("click", handleNewFlowClick);
    return () => {
      newFlowElement.removeEventListener("click", handleNewFlowClick);
    };
  });

  const fetchTemplateDetails = useCallback(
    async (templateAddressToFetch: string) => {
      if (messenger) {
        setLoading(true);
        try {
          const details = await signer.getTemplateDefinition(templateAddressToFetch);
          const document = new JsonDocument("Template definition", details);
          setJsonDocument(document);
          const outline = new JsonOutline(document, TEMPLATE_DETAILS_PARTS);
          setOutlineItems(outline.items);

          await messenger.send("showJsonOutline", {
            id: document.id,
            json: document.jsonString,
            outlineItems: outline.items,
          });
        } catch (error: unknown) {
          await messenger.send("showError", { message: "Failed to fetch template definition", detail: String(error) });
        }
        setLoading(false);
      }
    },
    [messenger, signer],
  );

  const handleEnterPressed = useCallback(() => {
    if (templateAddress) {
      fetchTemplateDetails(templateAddress).catch(console.log);
    }
  }, [templateAddress, fetchTemplateDetails]);

  useEnterKey(templateAddressRef, handleEnterPressed);

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Template Details">
        <VscodeIcon
          ref={newFlowRef}
          name="type-hierarchy-sub"
          id="btn-new-flow"
          actionIcon
          title="Open New Transaction Builder"
          slot="actions"
        />
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="templateAddress">Template Address</VscodeLabel>
            <VscodeTextfield
              ref={templateAddressRef}
              id="templateAddress"
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setTemplateAddress(target.value || null);
              }}
            />
          </VscodeFormGroup>
          <VscodeButton
            icon="code-oss"
            onClick={() => {
              if (templateAddress) {
                void fetchTemplateDetails(templateAddress);
              }
            }}
          >
            Fetch
          </VscodeButton>
          <VscodeDivider />
        </VscodeFormContainer>

        {loading && <VscodeProgressRing />}
        {!loading && jsonDocument && (
          <div>
            <div style={{ marginLeft: "10px" }}>
              <JsonOutlineTree
                items={outlineItems}
                onSelect={(item) => {
                  handleItemSelect(item).catch(console.log);
                }}
                onAction={(_actionId, item) => {
                  handleAddNode(item).catch(console.log);
                }}
                onDrag={handleDragNode}
              />
            </div>
            <VscodeDivider />
          </div>
        )}
      </VscodeCollapsible>
    </>
  );
}

export default TemplateActions;
