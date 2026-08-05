export function Footer() {
  return (
    <footer className="w-full px-6 py-4 text-gray-300 from-inherit">
      <div className="block text-center">
        <p>&copy; {new Date().getFullYear()} The Hidden Gaming Lair</p>
        <p className="text-sm">
          <a
            href="/status"
            className="text-gray-400 hover:text-gray-200 hover:underline"
          >
            Service Status
          </a>
        </p>
        <p className="text-sm text-gray-400">
          Built by{" "}
          <a
            href="https://leon-machens.dev"
            target="_blank"
            rel="noopener"
            className="hover:text-gray-200 underline"
          >
            Leon Machens
          </a>
        </p>
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
