import { TariProvider } from "@tari-project/tarijs";
import { VscodeDivider } from "@vscode-elements/react-elements";
import AccountActions from "./actions/AccountActions";
import ListSubstatesActions from "./actions/ListSubstatesActions";
import SubstateDetailsActions from "./actions/SubstateDetailsActions";
import { useState } from "react";
import TemplateActions from "./actions/TemplateActions";

interface ProviderActionsProps {
  provider: TariProvider;
}

function ProviderActions({ provider }: ProviderActionsProps) {
  const [substateId, setSubstateId] = useState<string | undefined>(undefined);
  const [accountsActionsOpen, setAccountsActionsOpen] = useState(false);
  const [listSubstatesActionsOpen, setListSubstatesActionsOpen] = useState(false);
  const [substateDetailsActionsOpen, setSubstateDetailsActionsOpen] = useState(false);
  const [templateActionsOpen, setTemplateActionsOpen] = useState(false);

  return (
    <>
      <VscodeDivider />
      <AccountActions provider={provider} open={accountsActionsOpen} onToggle={setAccountsActionsOpen} />
      <ListSubstatesActions
        provider={provider}
        onViewDetails={(item) => {
          if (item.value) {
            setSubstateId(item.value as string);
            setAccountsActionsOpen(false);
            setListSubstatesActionsOpen(false);
            setTemplateActionsOpen(false);
            setSubstateDetailsActionsOpen(true);
          }
        }}
        open={listSubstatesActionsOpen}
        onToggle={setListSubstatesActionsOpen}
      />
      <SubstateDetailsActions
        provider={provider}
        substateId={substateId}
        open={substateDetailsActionsOpen}
        onToggle={setSubstateDetailsActionsOpen}
      />
      <TemplateActions provider={provider} open={templateActionsOpen} onToggle={setTemplateActionsOpen} />
    </>
  );
}

export default ProviderActions;
