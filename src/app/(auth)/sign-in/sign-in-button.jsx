"use client";

import React from "react";
import { Button } from "@base-ui/react";
import { signIn } from "@/lib/auth-client";
import Image from "next/image";

const SignInButton = () => {
  return (
    <Button
      className="mt-5 flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground"
      onClick={() =>
        signIn.social({
          provider: "github",
          callbackURL: "/",
        })
      }
    >
      <Image
        src="/github.svg"
        alt="Github"
        width={20}
        height={20}
        className="invert"
      />
      <span>Sign in with GitHub</span>
    </Button>
  );
};

export default SignInButton;
