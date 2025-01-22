import { useEffect } from "react";
import { useLocation } from "wouter";
import { getCurrentUser } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [, navigate] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="w-full h-[600px]" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
