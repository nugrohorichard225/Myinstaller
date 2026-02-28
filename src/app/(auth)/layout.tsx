import { Server } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold">
            <Server className="h-6 w-6 text-primary" />
            MyInstaller
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
