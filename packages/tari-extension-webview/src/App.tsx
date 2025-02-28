import "flexboxgrid/css/flexboxgrid.min.css";
import { VscodeButton, VscodeFormGroup, VscodeFormHelper, VscodeLabel, VscodeRadio, VscodeRadioGroup, VscodeTabHeader, VscodeTabPanel, VscodeTabs, VscodeTextfield } from "@vscode-elements/react-elements";
import { useEffect, useState } from "react";
import { TariPermissions, WalletDaemonFetchParameters, WalletDaemonTariProvider } from "@tari-project/wallet-daemon-provider";
import { Account, TariProvider } from "@tari-project/tarijs";
import { Messenger, WebViewMessages } from "tari-extension-common";

if (import.meta.env.DEV) {
  await import("@vscode-elements/webview-playground");
}

function App({ messenger }: { messenger: Messenger<WebViewMessages> }) {
  const [provider, setProvider] = useState<TariProvider | undefined>(undefined);
  const [, setAccount] = useState<Account | undefined>(undefined);

  // TODO: remove
  console.log(typeof messenger);
  
  useEffect(() => {
    messenger
      .send("getSettings", {})
      .then((response) => {
        console.log("RESPONSE", response);
      })
      .catch((error: unknown) => {
        console.error("ERROR", error);
      });
  });

  /*
   const walletConnectConnect = async () => {
    const projectId = "1825b9dd9c17b5a33063ae91cbc48a6e";
    const walletConnectProvider = new WalletConnectTariProvider(projectId);
    console.log("Connecting to WalletConnect");
    await walletConnectProvider.connect();
    console.log("Connected to WalletConnect");
    const account = await walletConnectProvider.getAccount();
    console.log("Account", account);
    setAccount(account);
    setProvider(walletConnectProvider);
    await walletDaemonConnect();
  }
  */
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const walletDaemonConnect = async () => {
    const permissions = new TariPermissions().addPermission("Admin");
    const params: WalletDaemonFetchParameters = {
      permissions,
      serverUrl: "http://127.0.0.1:12010/json_rpc",
    };
    const walletDaemonProvider = await WalletDaemonTariProvider.buildFetchProvider(params);
    const account = await walletDaemonProvider.getAccount();
    console.log("Account", account);
    setAccount(account);
    setProvider(walletDaemonProvider);
  };
  
  const disconnect = () => {
    setProvider(undefined);
  };

  return (
    <>
      {import.meta.env.DEV ? <vscode-dev-toolbar></vscode-dev-toolbar> : null}
      
      <VscodeRadioGroup>
        <VscodeFormGroup>
          <VscodeRadio name="walletDaemonProvider" label="Wallet Daemon" />
          <VscodeFormHelper>HELPER!!!</VscodeFormHelper>
        </VscodeFormGroup>
        <VscodeFormGroup>
          <VscodeRadio name="walletConnectProvider" label="WalletConnect" />
          <VscodeFormHelper>HELPER2!!!</VscodeFormHelper>
        </VscodeFormGroup>
      </VscodeRadioGroup>



      <VscodeTabs>
        <VscodeTabHeader slot="header">WalletConnect</VscodeTabHeader>
        <VscodeTabPanel>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="walletConnectProjectId">Project ID</VscodeLabel>
            <VscodeTextfield id="walletConnectProjectId"></VscodeTextfield>
            <VscodeFormHelper>Wallet connect project ID. Leave it empty to default to Tari project ID</VscodeFormHelper>
          </VscodeFormGroup>
        </VscodeTabPanel>
        <VscodeTabHeader slot="header">Wallet Daemon</VscodeTabHeader>
        <VscodeTabPanel>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="walletDaemonAddress">JSON RPC address</VscodeLabel>
            <VscodeTextfield id="walletDaemonAddress"></VscodeTextfield>
            <VscodeFormHelper>
              Should be in form: <code>http://127.0.0.1:12010/json_rpc</code>
            </VscodeFormHelper>
          </VscodeFormGroup>
        </VscodeTabPanel>
      </VscodeTabs>

      <VscodeButton
        icon="vm-connect"
        disabled={!!provider}
        onClick={() => {
          void walletDaemonConnect();
        }}
      >
        Connect
      </VscodeButton>
      <VscodeButton icon="debug-disconnect" disabled={!provider} style={{ marginLeft: "8px" }} onClick={disconnect}>
        Disconnect
      </VscodeButton>
    </>
  );
}

export default App;
