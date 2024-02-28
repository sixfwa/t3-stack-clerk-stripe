import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const accountRouter = createTRPCRouter({
  getAccount: protectedProcedure.query(async ({ ctx }) => {
    const { db, auth } = ctx;

    return await db.account.findFirst({
      where: {
        userId: auth.userId,
      },
    });
  }),
});
