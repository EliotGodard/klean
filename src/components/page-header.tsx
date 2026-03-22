import { Settings } from "lucide-react";
import Link from "next/link";

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        <Link href="/parametres" className="text-gray-500 hover:text-gray-700">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
