import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Leaf className="w-6 h-6 text-eco-primary" />
        <span className="font-bold text-eco-text">EcoWatch AI</span>
      </Link>
      {children}
    </div>
  );
}
