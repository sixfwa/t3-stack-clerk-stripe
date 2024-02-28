import { db } from "@/server/db";
import { SignOutButton } from "@clerk/nextjs";
import { getAuth } from "@clerk/nextjs/server";
import type { GetServerSideProps } from "next";
import Link from "next/link";

// @ts-expect-error leave this alone
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);

  if (userId) {
    const account = await db.account.findFirst({
      where: {
        userId: userId,
      },
    });

    if (account?.status === "INACTIVE") {
      return {
        redirect: {
          destination: "/packages",
        },
      };
    }
  }

  return { props: {} };
};

const SuccessPage = () => {
  return (
    <section className="mt-10 flex flex-col gap-8">
      <header className="flex w-full flex-col gap-3">
        <h1 className="text-center text-4xl font-extrabold tracking-tight">
          Thanks for Joining
        </h1>
        <div className="mx-auto flex w-1/2 flex-row justify-between">
          <Link href="/" className="w-full text-center font-bold">
            Home
          </Link>
          <SignOutButton>
            <button className="w-full text-center font-bold">Sign Out</button>
          </SignOutButton>
        </div>
      </header>
    </section>
  );
};

export default SuccessPage;
