import { TariProvider } from "@tari-project/tarijs";
import { Messenger, TariConfiguration, WebViewMessages } from "tari-extension-common";
import { WebviewApi } from "vscode-webview";
import { create } from "zustand";

interface TariStore {
  vscode?: WebviewApi<unknown>;
  messenger?: Messenger<WebViewMessages>;
  configuration?: TariConfiguration;
  provider?: TariProvider;
}

interface TariStoreAction {
  setVscode: (vscode: TariStore["vscode"]) => void;
  setMessenger: (vscode: TariStore["messenger"]) => void;
  setConfiguration: (vscode: TariStore["configuration"]) => void;
  setProvider: (vscode: TariStore["provider"]) => void;
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
  setProvider: (provider) => {
    set(() => ({ provider }));
  },
}));
