import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { AppNavigation } from "@/components/nav/AppNavigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-karbon text-tinta flex w-full overflow-x-hidden">
      <AppNavigation userDisplayName={user.displayName || user.email?.split("@")[0]} />
      <div className="flex-1 min-w-0 w-full lg:pl-60 min-h-screen pb-24 lg:pb-12">
        <div className="max-w-[1120px] w-full min-w-0 mx-auto px-4 py-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
