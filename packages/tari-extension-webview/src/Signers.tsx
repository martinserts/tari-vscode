import {
  VscodeButton,
  VscodeCollapsible,
  VscodeFormGroup,
  VscodeFormHelper,
  VscodeLabel,
  VscodeTabHeader,
  VscodeTabPanel,
  VscodeTabs,
  VscodeTextfield,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import { useTariStore } from "./store/tari-store";
import {
  TariPermissions,
  WalletDaemonFetchParameters,
  WalletDaemonTariSigner,
} from "@tari-project/wallet-daemon-signer";
import { WalletConnectTariSigner } from "@tari-project/wallet-connect-signer";
import { TariConfiguration, TariProviderType } from "tari-extension-common";
import { useState } from "react";
import { useCollapsibleToggle } from "./hooks/collapsible-toggle";

const DEFAULT_WALLET_DAEMON_ADDRESS = "http://127.0.0.1:12010/json_rpc";
const DEFAULT_TARI_PROJECT_ID = "1825b9dd9c17b5a33063ae91cbc48a6e";
const PROVIDERS = [TariProviderType.WalletDemon, TariProviderType.WalletConnect];

interface SignersProps {
  configuration: TariConfiguration;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function Signers({ configuration, open, onToggle }: SignersProps) {
  const messenger = useTariStore((state) => state.messenger);
  const provider = useTariStore((state) => state.signer);
  const setProvider = useTariStore((state) => state.setSigner);

  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(
    PROVIDERS.indexOf(configuration.defaultProvider),
  );
  const [walletDaemonAddress, setWalletDaemonAddress] = useState<string>(configuration.walletDaemonAddress ?? "");
  const [walletConnectProjectId, setWalletConnectProjectId] = useState<string>(
    configuration.walletConnectProjectId ?? "",
  );
  const [connecting, setConnecting] = useState<boolean>(false);

  const collapsibleRef = useCollapsibleToggle(onToggle ?? (() => undefined));

  const handleDisconnect = () => {
    setProvider(undefined);
  };

  const handleWalletDaemonConnect = async () => {
    const permissions = new TariPermissions().addPermission("Admin");
    const params: WalletDaemonFetchParameters = {
      permissions,
      serverUrl: walletDaemonAddress || DEFAULT_WALLET_DAEMON_ADDRESS,
    };
    const walletDaemonProvider = await WalletDaemonTariSigner.buildFetchSigner(params);
    await walletDaemonProvider.getAccount();
    setProvider(walletDaemonProvider);
  };

  const handleWalletConnectConnect = async () => {
    const walletConnectProvider = new WalletConnectTariSigner(walletConnectProjectId || DEFAULT_TARI_PROJECT_ID);
    await walletConnectProvider.connect();
    setProvider(walletConnectProvider);
  };

  const handleConnect = async () => {
    if (messenger) {
      setConnecting(true);
      const longOperation = messenger.send("showLongOperation", { title: "Connecting", cancellable: true });
      try {
        const selectedProvider = PROVIDERS[selectedProviderIndex];
        switch (selectedProvider) {
          case TariProviderType.WalletDemon:
            await handleWalletDaemonConnect();
            await messenger.send("setWalletDaemonAddress", walletDaemonAddress);
            break;
          case TariProviderType.WalletConnect: {
            await messenger.send("updateLongOperation", { increment: 30, message: "Connecting to WalletConnect" });
            const result = await Promise.race([handleWalletConnectConnect(), longOperation]);
            const cancelled = result?.cancelled;
            if (!cancelled) {
              await messenger.send("setWalletConnectProjectId", walletConnectProjectId);
            }
            break;
          }
        }
        await messenger.send("setDefaultProvider", selectedProvider);
      } catch (error: unknown) {
        await messenger.send("showError", { message: "Failed to connect", detail: String(error) });
      }

      await messenger.send("endLongOperation", undefined);
      await longOperation;
      setConnecting(false);
    }
  };

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} title="Connection" open={open ?? true}>
        <VscodeTabs
          selectedIndex={selectedProviderIndex}
          onVscTabsSelect={(event) => {
            setSelectedProviderIndex(event.detail.selectedIndex);
          }}
        >
          <VscodeTabHeader slot="header">Wallet Daemon</VscodeTabHeader>
          <VscodeTabPanel>
            <VscodeFormGroup>
              <VscodeLabel htmlFor="walletDaemonAddress">JSON RPC address</VscodeLabel>
              <VscodeTextfield
                id="walletDaemonAddress"
                value={walletDaemonAddress}
                onInput={(event) => {
                  const target = event.target as ve.VscodeTextfield;
                  setWalletDaemonAddress(target.value);
                }}
              />
              <VscodeFormHelper>
                Empty to defaults to <code>{DEFAULT_WALLET_DAEMON_ADDRESS}</code>
              </VscodeFormHelper>
            </VscodeFormGroup>
          </VscodeTabPanel>
          <VscodeTabHeader slot="header">WalletConnect</VscodeTabHeader>
          <VscodeTabPanel>
            <VscodeFormGroup>
              <VscodeLabel htmlFor="walletConnectProjectId">Project ID</VscodeLabel>
              <VscodeTextfield
                id="walletConnectProjectId"
                value={walletConnectProjectId}
                onInput={(event) => {
                  const target = event.target as ve.VscodeTextfield;
                  setWalletConnectProjectId(target.value);
                }}
              />
              <VscodeFormHelper>
                Empty defaults to Tari project ID. You will need to reconnect, if you switch away from Tari extension.
              </VscodeFormHelper>
            </VscodeFormGroup>
          </VscodeTabPanel>
        </VscodeTabs>

        <VscodeButton
          icon="vm-connect"
          disabled={!!provider || connecting}
          onClick={() => {
            void handleConnect();
          }}
        >
          Connect
        </VscodeButton>
        <VscodeButton
          icon="debug-disconnect"
          disabled={!provider}
          style={{ marginLeft: "8px" }}
          onClick={handleDisconnect}
        >
          Disconnect
        </VscodeButton>
      </VscodeCollapsible>
    </>
  );
}

export default Signers;
