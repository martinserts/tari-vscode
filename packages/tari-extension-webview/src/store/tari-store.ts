import { TariSigner } from "@tari-project/tarijs-all";
import { Messenger, TariConfiguration, WebViewMessages } from "tari-extension-common";
import { WebviewApi } from "vscode-webview";
import { create } from "zustand";

interface TariStore {
  vscode?: WebviewApi<unknown>;
  messenger?: Messenger<WebViewMessages>;
  configuration?: TariConfiguration;
  signer?: TariSigner;
}

interface TariStoreAction {
  setVscode: (vscode: TariStore["vscode"]) => void;
  setMessenger: (vscode: TariStore["messenger"]) => void;
  setConfiguration: (vscode: TariStore["configuration"]) => void;
  setSigner: (vscode: TariStore["signer"]) => void;
}

export const useTariStore = create<TariStore & TariStoreAction>()((set) => ({
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
}));
