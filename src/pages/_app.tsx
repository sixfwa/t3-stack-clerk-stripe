import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";

import { api } from "@/utils/api";

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <main className="mx-auto flex w-1/2 flex-col p-5">
        <Component {...pageProps} />
      </main>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
