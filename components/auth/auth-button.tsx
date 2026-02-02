"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AuthButtonProps {
  user: any;
}

export function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (user) {
    return (
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.push("/login")}>
        Log in
      </Button>
      <Button onClick={() => router.push("/signup")}>Sign up</Button>
    </div>
  );
}
