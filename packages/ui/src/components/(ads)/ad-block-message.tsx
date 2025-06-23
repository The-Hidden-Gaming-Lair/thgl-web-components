export function AdBlockMessage({ hideText }: { hideText?: boolean }) {
  return (
    <>
      <p className="text-center font-semibold p-2">Ad loot lost! 💰</p>
      {!hideText && (
        <p className="text-center text-sm text-gray-500 p-2">
          Disable your ad blocker and help keep this site free for all
          adventurers.
        </p>
      )}
    </>
  );
}
