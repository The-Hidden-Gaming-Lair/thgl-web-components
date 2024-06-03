import { HeaderLink } from "./header-link";

export function InteractiveMapLink({
  active,
}: {
  active: boolean;
}): JSX.Element {
  return (
    <HeaderLink active={active}>
      <div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" />
          <path d="M9 4v13" />
          <path d="M15 7v13" />
        </svg>
        <span>Interactive Map</span>
      </div>
    </HeaderLink>
  );
}
