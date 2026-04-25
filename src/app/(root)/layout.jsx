import { auth } from "@/lib/auth";
import { currentUser } from "@/modules/authentication/actions";
import ChatSidebar from "@/modules/chat/components/chat-sidebar";
import Header from "@/modules/chat/components/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const layout = async ({ children }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = await currentUser();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar user={user} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};

export default layout;
