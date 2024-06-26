import { trackOutboundLinkClick } from "./plausible-tracker";

export function ExternalAnchor({
  onClick,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "target">): JSX.Element {
  return (
    <a
      {...props}
      target="_blank"
      onClick={(event) => {
        trackOutboundLinkClick(event.currentTarget.href);
        if (onClick) {
          onClick(event);
        }
      }}
    />
  );
}
