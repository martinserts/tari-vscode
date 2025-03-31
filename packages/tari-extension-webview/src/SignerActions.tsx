import { TariSigner } from "@tari-project/tarijs-all";
import { VscodeDivider } from "@vscode-elements/react-elements";
import AccountActions from "./actions/AccountActions";
import ListSubstatesActions from "./actions/ListSubstatesActions";
import SubstateDetailsActions from "./actions/SubstateDetailsActions";
import { useState } from "react";
import TemplateActions from "./actions/TemplateActions";

interface SignerActionsProps {
  signer: TariSigner;
}

function SignerActions({ signer }: SignerActionsProps) {
  const [substateId, setSubstateId] = useState<string | undefined>(undefined);
  const [accountsActionsOpen, setAccountsActionsOpen] = useState(false);
  const [listSubstatesActionsOpen, setListSubstatesActionsOpen] = useState(false);
  const [substateDetailsActionsOpen, setSubstateDetailsActionsOpen] = useState(false);
  const [templateActionsOpen, setTemplateActionsOpen] = useState(false);

  return (
    <>
      <VscodeDivider />
      <AccountActions signer={signer} open={accountsActionsOpen} onToggle={setAccountsActionsOpen} />
      <ListSubstatesActions
        signer={signer}
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
        signer={signer}
        substateId={substateId}
        open={substateDetailsActionsOpen}
        onToggle={setSubstateDetailsActionsOpen}
      />
      <TemplateActions signer={signer} open={templateActionsOpen} onToggle={setTemplateActionsOpen} />
    </>
  );
}

export default SignerActions;
