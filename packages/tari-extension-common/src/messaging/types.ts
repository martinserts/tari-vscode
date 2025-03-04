import { TariConfiguration } from "../configuration/tari-configuration";
import { JsonOutlineItem } from "../outline";

export interface WebViewMessages {
  /** Webview -> Extension */
  showError: {
    request: {
      message: string;
      detail?: string;
    };
    response: undefined;
  };
  getConfiguration: {
    request: undefined;
    response: TariConfiguration;
  };
  setWalletDaemonAddress: {
    request: TariConfiguration["walletDaemonAddress"];
    response: undefined;
  };
  setWalletConnectProjectId: {
    request: TariConfiguration["walletConnectProjectId"];
    response: undefined;
  };
  setDefaultProvider: {
    request: TariConfiguration["defaultProvider"];
    response: undefined;
  };
  showLongOperation: {
    request: {
      title: string;
      cancellable: boolean;
    };
    response: {
      cancelled: boolean;
    };
  };
  updateLongOperation: {
    request: {
      increment: number;
      message: string;
    };
    response: undefined;
  };
  endLongOperation: {
    request: undefined;
    response: undefined;
  };
  showJsonOutline: {
    request: {
      id: string;
      json: string;
      outlineItems: JsonOutlineItem[];
      selected?: JsonOutlineItem;
    };
    response: undefined;
  };

  /** Extension -> Webview */
  configurationChanged: {
    request: TariConfiguration;
    response: undefined;
  };
}
