import { AccountData, TariSigner, TransactionResult, TransactionStatus } from "@tari-project/tarijs-all";
import { Messenger, TariConfiguration, WebViewMessages } from "tari-extension-common";
import { WebviewApi } from "vscode-webview";
import { create } from "zustand";

const MAX_TRANSACTION_EXECUTION_RESULTS = 5;

export interface TransactionExecutionResult {
  date: Date;
  succeeded: boolean;
  result: TransactionResult;
}

export interface TariStore {
  vscode?: WebviewApi<unknown>;
  messenger?: Messenger<WebViewMessages>;
  configuration?: TariConfiguration;
  signer?: TariSigner;
  accountData?: AccountData;
  transactionExecutions: TransactionExecutionResult[];
  accountsActionsOpen: boolean;
  listSubstatesActionsOpen: boolean;
  substateDetailsActionsOpen: boolean;
  templateActionsOpen: boolean;
  transactionExecutionActionsOpen: boolean;
}

export interface TariStoreAction {
  setVscode: (vscode: TariStore["vscode"]) => void;
  setMessenger: (vscode: TariStore["messenger"]) => void;
  setConfiguration: (vscode: TariStore["configuration"]) => void;
  setSigner: (vscode: TariStore["signer"]) => void;
  setAccountData: (vscode: TariStore["accountData"]) => void;
  addTransactionExecution: (result: TransactionResult) => void;
  setAccountsActionsOpen: (vscode: TariStore["accountsActionsOpen"]) => void;
  setListSubstatesActionsOpen: (vscode: TariStore["listSubstatesActionsOpen"]) => void;
  setSubstateDetailsActionsOpen: (vscode: TariStore["substateDetailsActionsOpen"]) => void;
  setTemplateActionsOpen: (vscode: TariStore["templateActionsOpen"]) => void;
  setTransactionExecutionActionsOpen: (vscode: TariStore["transactionExecutionActionsOpen"]) => void;
  closeAllActions: () => void;
}

export const useTariStore = create<TariStore & TariStoreAction>()((set, get) => ({
  setVscode: (vscode) => {
    set(() => ({ vscode }));
  },
  setMessenger: (messenger) => {
    set(() => ({ messenger }));
  },
  setConfiguration: (configuration) => {
    set(() => ({ configuration }));
  },
  setSigner: (signer) => {
    set(() => ({ signer }));
  },
  setAccountData: (accountData) => {
    set(() => ({ accountData }));
  },
  transactionExecutions: [],
  addTransactionExecution: (result) => {
    const date = new Date();
    const succeeded = result.status === TransactionStatus.Accepted || result.status === TransactionStatus.DryRun;
    set((state) => {
      const newExecutions = [{ date, succeeded, result }, ...state.transactionExecutions];
      if (newExecutions.length > MAX_TRANSACTION_EXECUTION_RESULTS) {
        newExecutions.pop();
      }
      return { transactionExecutions: newExecutions };
    });
  },
  accountsActionsOpen: false,
  setAccountsActionsOpen: (accountsActionsOpen) => {
    set(() => ({ accountsActionsOpen }));
  },
  listSubstatesActionsOpen: false,
  setListSubstatesActionsOpen: (listSubstatesActionsOpen) => {
    set(() => ({ listSubstatesActionsOpen }));
  },
  substateDetailsActionsOpen: false,
  setSubstateDetailsActionsOpen: (substateDetailsActionsOpen) => {
    set(() => ({ substateDetailsActionsOpen }));
  },
  templateActionsOpen: false,
  setTemplateActionsOpen: (templateActionsOpen) => {
    set(() => ({ templateActionsOpen }));
  },
  transactionExecutionActionsOpen: false,
  setTransactionExecutionActionsOpen: (transactionExecutionActionsOpen) => {
    set(() => ({ transactionExecutionActionsOpen }));
  },
  closeAllActions: () => {
    get().setAccountsActionsOpen(false);
    get().setListSubstatesActionsOpen(false);
    get().setSubstateDetailsActionsOpen(false);
    get().setTemplateActionsOpen(false);
    get().setTransactionExecutionActionsOpen(false);
  },
}));
