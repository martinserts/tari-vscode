import { TransactionBuilder } from "@tari-project/tarijs-all";

export interface FeeTransactionPayFromComponentDescription {
  type: "feeTransactionPayFromComponent";
  args: Parameters<TransactionBuilder["feeTransactionPayFromComponent"]>;
}

export interface ArgValueFromWorkspace {
  type: "workspace";
  value: string;
}

export interface ArgValueOther {
  type: "other";
  value: unknown;
}

export type ArgValue = ArgValueFromWorkspace | ArgValueOther;

export interface CallMethodDescription {
  type: "callMethod";
  method: Parameters<TransactionBuilder["callMethod"]>[0];
  args: ArgValue[];
}

export interface CallFunctionDescription {
  type: "callFunction";
  function: Parameters<TransactionBuilder["callFunction"]>[0];
  args: ArgValue[];
}

export interface AddInstructionDescription {
  type: "addInstruction";
  args: Parameters<TransactionBuilder["addInstruction"]>;
}

export interface SaveVarDescription {
  type: "saveVar";
  key: string;
}

export type TransactionDescription =
  | FeeTransactionPayFromComponentDescription
  | CallMethodDescription
  | CallFunctionDescription
  | AddInstructionDescription
  | SaveVarDescription;
