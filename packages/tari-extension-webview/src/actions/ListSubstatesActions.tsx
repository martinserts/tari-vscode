import { TariSigner } from "@tari-project/tarijs-all";
import {
  VscodeFormGroup,
  VscodeCollapsible,
  VscodeFormContainer,
  VscodeLabel,
  VscodeTextfield,
  VscodeSingleSelect,
  VscodeOption,
  VscodeButton,
  VscodeProgressRing,
  VscodeDivider,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import "./list-substates.css";
import { useTariStore } from "../store/tari-store";
import { JsonDocument } from "../json-parser/JsonDocument";
import { JsonOutlineItem } from "tari-extension-common";
import { useState } from "react";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonOutline } from "../json-parser/JsonOutline";
import { SUBSTATE_LIST_PARTS } from "../json-parser/known-parts/substate-list";
import { SubstateType } from "@tari-project/typescript-bindings";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";

const DEFAULT_LIMIT = 15;
const DEFAULT_OFFSET = 0;

interface ListSubstatesActionsProps {
  signer: TariSigner;
  onViewDetails: (item: JsonOutlineItem) => void;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function ListSubstatesActions({ signer, onViewDetails, open, onToggle }: ListSubstatesActionsProps) {
  const messenger = useTariStore((state) => state.messenger);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [subsateType, setSubstateType] = useState<SubstateType | undefined>(undefined);
  const [tempateAddress, setTemplateAddress] = useState<string | null>(null);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(DEFAULT_OFFSET);

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

  const fetchSubstateList = async () => {
    if (messenger) {
      setLoading(true);
      try {
        const request = {
          filter_by_template: tempateAddress,
          filter_by_type: subsateType ?? null,
          limit,
          offset,
        };
        const substates = await signer.listSubstates(request);
        const document = new JsonDocument("Substates", substates);
        setJsonDocument(document);
        const outline = new JsonOutline(document, SUBSTATE_LIST_PARTS);
        setOutlineItems(outline.items);

        await messenger.send("showJsonOutline", {
          id: document.id,
          json: document.jsonString,
          outlineItems: outline.items,
        });
      } catch (error: unknown) {
        await messenger.send("showError", { message: "Failed to list substates", detail: String(error) });
      }
      setLoading(false);
    }
  };

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="List Substates" className="list-substates">
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="substateType">Substate Type</VscodeLabel>
            <VscodeSingleSelect
              id="substateType"
              onChange={(event) => {
                const target = event.target as ve.VscodeSingleSelect;
                setSubstateType(target.value.length ? (target.value as SubstateType) : undefined);
              }}
            >
              <VscodeOption></VscodeOption>
              <VscodeOption description="Component" value="Component">
                Component
              </VscodeOption>
              <VscodeOption description="Resource" value="Resource">
                Resource
              </VscodeOption>
              <VscodeOption description="Vault" value="Vault">
                Vault
              </VscodeOption>
              <VscodeOption description="Template" value="Template">
                Template
              </VscodeOption>
              <VscodeOption description="TransactionReceipt" value="TransactionReceipt">
                TransactionReceipt
              </VscodeOption>
              <VscodeOption description="NonFungible" value="NonFungible">
                NonFungible
              </VscodeOption>
              <VscodeOption description="NonFungibleIndex" value="NonFungibleIndex">
                NonFungibleIndex
              </VscodeOption>
              <VscodeOption description="ValidatorFeePool" value="ValidatorFeePool">
                ValidatorFeePool
              </VscodeOption>
              <VscodeOption description="UnclaimedConfidentialOutput" value="UnclaimedConfidentialOutput">
                UnclaimedConfidentialOutput
              </VscodeOption>
            </VscodeSingleSelect>
          </VscodeFormGroup>
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
          <VscodeFormGroup>
            <VscodeLabel htmlFor="limit">Limit</VscodeLabel>
            <VscodeTextfield
              id="limit"
              type="number"
              min={1}
              pattern="\d+"
              value={limit.toString()}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setLimit(getNumber(target.value, DEFAULT_LIMIT));
              }}
            />
          </VscodeFormGroup>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="offset">Offset</VscodeLabel>
            <VscodeTextfield
              id="offset"
              type="number"
              min={0}
              pattern="\d+"
              value={offset.toString()}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setOffset(getNumber(target.value, DEFAULT_OFFSET));
              }}
            />
          </VscodeFormGroup>
          <VscodeButton
            icon="list-unordered"
            onClick={() => {
              void fetchSubstateList();
            }}
          >
            List
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
                  onViewDetails(item);
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

function getNumber(text: string, def: number): number {
  const n = parseInt(text);
  return Number.isNaN(n) ? def : n;
}

export default ListSubstatesActions;
