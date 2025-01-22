import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";

export function Navbar() {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "ログアウトしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          YOXO Fes
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:underline">
                ダッシュボード
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                ログアウト
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => window.location.href = '/form'}>
              測定を開始する
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}