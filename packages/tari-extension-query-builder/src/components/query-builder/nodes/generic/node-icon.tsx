import { GenericNodeIcon } from "@/store/types";
import { CheckCircledIcon, CubeIcon, EnterIcon, HomeIcon, RocketIcon } from "@radix-ui/react-icons";

interface NodeIconProps {
  icon: GenericNodeIcon;
  className: string;
}

function NodeIcon(props: NodeIconProps) {
  const { icon, className } = props;
  switch (icon) {
    case "enter":
      return <EnterIcon className={className} />;
    case "rocket":
      return <RocketIcon className={className} />;
    case "home":
      return <HomeIcon className={className} />;
    case "cube":
      return <CubeIcon className={className} />;
    case "check-circled":
      return <CheckCircledIcon className={className} />;
  }
}

export default NodeIcon;
