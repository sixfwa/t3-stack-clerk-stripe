import { db } from "@/server/db";
import { api } from "@/utils/api";
import {
  SignInButton,
  SignUpButton,
  SignOutButton,
  useUser,
} from "@clerk/nextjs";
import { getAuth } from "@clerk/nextjs/server";
import type { GetServerSideProps } from "next";

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

export default function Home() {
  const { isSignedIn } = useUser();

  const { data: accountData } = api.account.getAccount.useQuery(void {}, {
    enabled: isSignedIn,
  });

  const { mutate: cancelSubscriptionMutation } =
    api.stripe.cancelSubscription.useMutation({
      onSuccess: async () => {
        window.location.reload();
      },
    });

  const { mutate: resumeSubscriptionMutation } =
    api.stripe.resumeSubscription.useMutation({
      onSuccess: async () => {
        window.location.reload();
      },
    });

  const handleCancelSubscription = async () => {
    cancelSubscriptionMutation({
      stripeCustomerId: accountData!.stripeCustomerId!,
    });
  };

  const handleResumeSubscription = async () => {
    resumeSubscriptionMutation({
      stripeCustomerId: accountData!.stripeCustomerId!,
    });
  };
  return (
    <section className="mt-10 flex flex-col gap-8">
      <h1 className="text-center font-sans text-5xl font-extrabold tracking-tight">
        Your Super Cool SaaS Application
      </h1>
      {isSignedIn ? (
        <div className="flex flex-col gap-5">
          {accountData?.package === "MONTHLY_SUBSCRIPTION" &&
            accountData.status === "ACTIVE" && (
              <button
                onClick={handleCancelSubscription}
                className="mx-auto w-min whitespace-nowrap font-bold"
              >
                Cancel Subscription
              </button>
            )}
          {accountData?.package === "MONTHLY_SUBSCRIPTION" &&
            accountData.status === "CANCELLED" && (
              <button
                onClick={handleResumeSubscription}
                className="mx-auto w-min whitespace-nowrap font-bold"
              >
                Resume Subscription
              </button>
            )}
          <SignOutButton>
            <button className="mx-auto w-min whitespace-nowrap border border-rose-900 bg-gradient-to-br from-rose-500 to-rose-700 px-10 py-2 text-2xl tracking-wide text-neutral-100 shadow-md">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      ) : (
        <div className="mx-auto flex flex-col gap-4">
          <SignUpButton>
            <button className="mx-auto w-min whitespace-nowrap border border-indigo-900 bg-gradient-to-br from-indigo-500 to-indigo-700 px-10 py-2 text-2xl tracking-wide text-neutral-100 shadow-md">
              Sign Up
            </button>
          </SignUpButton>
          <SignInButton redirectUrl="/">
            <button className="text-center text-lg font-bold text-indigo-900">
              Or Login
            </button>
          </SignInButton>
        </div>
      )}
    </section>
  );
}
