export function Footer() {
  return (
    <footer className="w-full border-t bg-gradient-to-b px-6 py-4 border-neutral-800 bg-zinc-800/30 text-gray-300 from-inherit">
      <div className="block text-center">
        <p>&copy; {new Date().getFullYear()} The Hidden Gaming Lair</p>
        <p className="text-xs text-gray-400">
          The apps and developers featured on this site are not affiliated with
          the respective game companies. The apps are independently developed to
          enhance the gaming experience for players. All trademarks, service
          marks, trade names, product names, and logos appearing on this site
          are the property of their respective owners.
        </p>
      </div>
    </footer>
  );
}
