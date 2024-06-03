import { signIn } from "@/auth.ts";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("discord");
      }}
    >
      <button type="submit">Signin with Discord</button>
    </form>
  );
}
