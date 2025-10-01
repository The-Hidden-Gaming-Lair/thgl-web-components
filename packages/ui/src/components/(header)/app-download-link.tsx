import { HeaderLink } from "./header-link";

export function AppDownload({ active }: { active: boolean }): JSX.Element {
  return (
    <HeaderLink active={active}>
      <div>
        <svg
          fill="none"
          height="22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="22"
        >
          <path d="M0 0h24v24H0z" fill="none" stroke="none" />
          <path d="M17.8 20l-12 -1.5c-1 -.1 -1.8 -.9 -1.8 -1.9v-9.2c0 -1 .8 -1.8 1.8 -1.9l12 -1.5c1.2 -.1 2.2 .8 2.2 1.9v12.1c0 1.2 -1.1 2.1 -2.2 1.9z" />
          <path d="M12 5l0 14" />
          <path d="M4 12l16 0" />
        </svg>
        <span className="hidden md:block">In-Game App</span>
      </div>
    </HeaderLink>
  );
}
