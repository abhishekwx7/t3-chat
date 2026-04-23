import React from "react";
import Image from "next/image";
import SignInButton from "./sign-in-button";

const Page = () => {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 md:py-32">
      <div className="flex items-center gap-x-2">
        <h1 className="text-3xl font-extrabold text-foreground">Welcome to</h1>
        <Image src="/t3-logo.png" alt="Logo" width={90} height={30} />
      </div>

      <p className="mt-2 text-lg font-semibold text-muted-foreground">
        Sign-in
      </p>

      <SignInButton />
    </section>
  );
};

export default Page;
