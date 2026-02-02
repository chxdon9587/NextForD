import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth/auth-button";

export async function Header() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            4D
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/projects"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Explore
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Start a Project
              </Link>
            </>
          )}
          <AuthButton user={user} />
        </div>
      </div>
    </header>
  );
}
