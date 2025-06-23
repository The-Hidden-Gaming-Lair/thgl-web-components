"use client";

export function SignOut() {
  return (
    <button
      className="text-sm hover:underline block w-fit mx-auto"
      onClick={() => {
        fetch("/api/patreon", { method: "DELETE" }).then(() => {
          location.reload();
        });
      }}
    >
      or sign out
    </button>
  );
}
