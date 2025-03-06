import { TariProvider } from "@tari-project/tarijs";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import { useCallback, useState } from "react";
import { useTariStore } from "../store/tari-store";
import {
  VscodeButton,
  VscodeCollapsible,
  VscodeDivider,
  VscodeFormContainer,
  VscodeFormGroup,
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

interface TemplateActionsProps {
  provider: TariProvider;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function TemplateActions({ provider, open, onToggle }: TemplateActionsProps) {
  const messenger = useTariStore((state) => state.messenger);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateAddress, setTemplateAddress] = useState<string | null>(null);

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

  const fetchTemplateDetails = useCallback(
    async (templateAddressToFetch: string) => {
      if (messenger) {
        setLoading(true);
        try {
          const details = await provider.getTemplateDefinition(templateAddressToFetch);
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
    [messenger, provider],
  );

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Template Details">
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="templateAddress">Template Address</VscodeLabel>
            <VscodeTextfield
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
                  void handleItemSelect(item);
                }}
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
