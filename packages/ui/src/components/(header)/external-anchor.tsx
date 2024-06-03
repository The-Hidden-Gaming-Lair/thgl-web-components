import { trackOutboundLinkClick } from "./plausible-tracker";

export function ExternalAnchor(
  props: Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "onClick" | "target"
  >
): JSX.Element {
  return (
    <a
      {...props}
      target="_blank"
      onClick={(event) => trackOutboundLinkClick(event.currentTarget.href)}
    />
  );
}
