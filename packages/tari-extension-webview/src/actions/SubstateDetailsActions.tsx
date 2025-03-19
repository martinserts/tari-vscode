import { TariProvider } from "@tari-project/tarijs";
import { useTariStore } from "../store/tari-store";
import { useCallback, useEffect, useState } from "react";
import { JsonOutlineItem } from "tari-extension-common";
import { JsonDocument } from "../json-parser/JsonDocument";
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
import { JsonOutline } from "../json-parser/JsonOutline";
import { SUBSTATE_DETAILS_PARTS } from "../json-parser/known-parts/substate-details";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";

interface SubstateDetailsActionsProps {
  provider: TariProvider;
  substateId?: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function SubstateDetailsActions({
  provider,
  substateId: externalSubstateId,
  open,
  onToggle,
}: SubstateDetailsActionsProps) {
  const messenger = useTariStore((state) => state.messenger);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [substateId, setSubstateId] = useState<string | null>(externalSubstateId ?? null);

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

  const fetchSubstateDetails = useCallback(
    async (substateIdToFetch: string) => {
      if (messenger) {
        setLoading(true);
        try {
          const details = await provider.getSubstate(substateIdToFetch);
          const document = new JsonDocument("Substate details", details);
          setJsonDocument(document);
          const outline = new JsonOutline(document, SUBSTATE_DETAILS_PARTS);
          setOutlineItems(outline.items);

          await messenger.send("showJsonOutline", {
            id: document.id,
            json: document.jsonString,
            outlineItems: outline.items,
          });
        } catch (error: unknown) {
          await messenger.send("showError", { message: "Failed to fetch substate details", detail: String(error) });
        }
        setLoading(false);
      }
    },
    [messenger, provider],
  );

  useEffect(() => {
    if (externalSubstateId !== undefined) {
      setSubstateId(externalSubstateId);
      void fetchSubstateDetails(externalSubstateId);
    }
  }, [externalSubstateId, fetchSubstateDetails]);

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Substate Details">
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="substateId">Substate ID</VscodeLabel>
            <VscodeTextfield
              id="substateId"
              value={substateId ?? ""}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setSubstateId(target.value || null);
              }}
            />
          </VscodeFormGroup>
          <VscodeButton
            icon="code-oss"
            onClick={() => {
              if (substateId) {
                void fetchSubstateDetails(substateId);
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
              />
            </div>
            <VscodeDivider />
          </div>
        )}
      </VscodeCollapsible>
    </>
  );
}

export default SubstateDetailsActions;
