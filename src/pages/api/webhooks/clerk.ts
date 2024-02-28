import { Webhook } from "svix";
import { buffer } from "micro";
import { env } from "@/env";
import { db } from "@/server/db";

import type { WebhookEvent } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405);
  }

  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add a web hook secret");
  }

  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "error occured - no svix headers" });
  }

  const body = (await buffer(req)).toString();

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).json({ Error: err });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const count = await db.account.count({
        where: {
          userId: id!,
        },
      });

      if (!count) {
        await db.account.create({
          data: {
            userId: id!,
          },
        });
      }
    }

    default: {
      console.error(`The event type: ${eventType} is not configured`);
    }
  }

  return res.status(200).json({ response: "Success" });
}
