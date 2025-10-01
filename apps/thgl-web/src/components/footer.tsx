export function Footer() {
  return (
    <footer className="w-full border-t  px-6 py-4 border-x border-[#1d1d1f]   text-gray-300 from-inherit">
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
