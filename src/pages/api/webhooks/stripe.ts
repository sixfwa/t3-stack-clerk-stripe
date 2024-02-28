import { buffer } from "micro";
import Stripe from "stripe";
import { env } from "@/env";
import { db } from "@/server/db";
import type { NextApiRequest, NextApiResponse } from "next";

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const requestBuffer = await buffer(request);
    const sig = request.headers["stripe-signature"]!;

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    const event = stripe.webhooks.constructEvent(
      requestBuffer.toString(),
      sig,
      webhookSecret,
    );

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object;

        await db.account.update({
          where: {
            userId: subscription.metadata.userId,
          },
          data: {
            status: "ACTIVE",
            package: "MONTHLY_SUBSCRIPTION",
            stripeCustomerId: subscription.customer as string,
          },
        });
        break;
      }

      case "checkout.session.completed": {
        const payment = event.data.object;

        if (payment.mode === "payment") {
          await db.account.update({
            where: {
              userId: payment.metadata!.userId,
            },
            data: {
              status: "ACTIVE",
              package: "LIFETIME",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        if (subscription.cancel_at_period_end) {
          await db.account.update({
            where: {
              userId: subscription.metadata.userId,
            },
            data: {
              status: "CANCELLED",
            },
          });
        } else {
          await db.account.update({
            where: {
              userId: subscription.metadata.userId,
            },
            data: {
              status: "ACTIVE",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await db.account.update({
          where: {
            userId: subscription.metadata.userId,
          },
          data: {
            status: "INACTIVE",
            package: null,
            stripeCustomerId: null,
          },
        });

        break;
      }
    }
    response.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(500).end();
  }
}
