import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import {
  VscodeButton,
  VscodeCollapsible,
  VscodeDivider,
  VscodeIcon,
  VscodeLabel,
  VscodeTable,
  VscodeTableBody,
  VscodeTableCell,
  VscodeTableHeader,
  VscodeTableHeaderCell,
  VscodeTableRow,
} from "@vscode-elements/react-elements";
import { useTariStore } from "../store/tari-store";
import { useState } from "react";
import { JsonDocument } from "../json-parser/JsonDocument";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonOutlineItem } from "tari-extension-common";
import { TransactionResult } from "@tari-project/tarijs-all";
import { JsonOutline } from "../json-parser/JsonOutline";
import { TRANSACTION_EXECUTION_PARTS } from "../json-parser/known-parts/transaction-execution";

interface TransactionExecutionActionsProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function TransactionExecutionActions({ open, onToggle }: TransactionExecutionActionsProps) {
  const collapsibleRef = useCollapsibleToggle(onToggle ?? (() => undefined));
  const transactionExecutions = useTariStore((state) => state.transactionExecutions);
  const messenger = useTariStore((state) => state.messenger);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const hasItems = transactionExecutions.length > 0;

  const handleLoadTransaction = async (result: TransactionResult) => {
    const json = result.result;
    if (json && messenger) {
      const document = new JsonDocument("Execution result", json);
      setJsonDocument(document);
      const outline = new JsonOutline(document, TRANSACTION_EXECUTION_PARTS);
      setOutlineItems(outline.items);
      await messenger.send("showJsonOutline", {
        id: document.id,
        json: document.jsonString,
        outlineItems: outline.items,
      });
    }
  };

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

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Execution Results">
        <div>
          <div style={{ marginLeft: "10px" }}>
            <VscodeDivider />
            {!hasItems && <VscodeLabel>No Items</VscodeLabel>}
            {hasItems && (
              <VscodeTable
                key={transactionExecutions[0].date.getTime()}
                resizable={true}
                responsive={true}
                borderedColumns={true}
                borderedRows={true}
                zebra={true}
                columns={["60px", "auto", "70px", "70px"]}
              >
                <VscodeTableHeader>
                  <VscodeTableHeaderCell>No.</VscodeTableHeaderCell>
                  <VscodeTableHeaderCell>Date</VscodeTableHeaderCell>
                  <VscodeTableHeaderCell>Success</VscodeTableHeaderCell>
                  <VscodeTableHeaderCell></VscodeTableHeaderCell>
                </VscodeTableHeader>
                <VscodeTableBody>
                  {transactionExecutions.map((row, idx) => (
                    <VscodeTableRow key={row.date.getTime().toString()}>
                      <VscodeTableCell>{idx + 1}</VscodeTableCell>
                      <VscodeTableCell>{row.date.toLocaleString()}</VscodeTableCell>
                      <VscodeTableCell>
                        {row.succeeded ? (
                          <VscodeIcon name="check"></VscodeIcon>
                        ) : (
                          <VscodeIcon name="error"></VscodeIcon>
                        )}
                      </VscodeTableCell>
                      <VscodeTableCell>
                        <VscodeButton
                          onClick={() => {
                            handleLoadTransaction(row.result).catch(console.log);
                          }}
                        >
                          Load
                        </VscodeButton>
                      </VscodeTableCell>
                    </VscodeTableRow>
                  ))}
                </VscodeTableBody>
              </VscodeTable>
            )}
            {jsonDocument && (
              <>
                <VscodeDivider />
                <JsonOutlineTree
                  items={outlineItems}
                  onSelect={(item) => {
                    handleItemSelect(item).catch(console.log);
                  }}
                />
                <VscodeDivider />
              </>
            )}
          </div>
        </div>
      </VscodeCollapsible>
    </>
  );
}

export default TransactionExecutionActions;
