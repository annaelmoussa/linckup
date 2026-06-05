import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Pool } from "pg";

type OrderPlacedEvent = {
  id: string;
};

const globalForLinckup = globalThis as unknown as {
  linckupProvisioningPool?: Pool;
};

const DEFAULT_TRIAL_DAYS = Number(process.env.LINCKUP_TRIAL_DAYS || 14);

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Linckup provisioning");
  }

  if (!globalForLinckup.linckupProvisioningPool) {
    globalForLinckup.linckupProvisioningPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalForLinckup.linckupProvisioningPool;
}

function createTrialEndsAt() {
  const value = new Date();
  value.setDate(
    value.getDate() +
      (Number.isFinite(DEFAULT_TRIAL_DAYS) ? DEFAULT_TRIAL_DAYS : 14),
  );
  return value;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

export default async function provisionLinckupWorkspace({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "items.title",
      "items.variant_sku",
      "items.variant.sku",
    ],
    filters: {
      id: data.id,
    },
  });

  const order = orders[0] as
    | {
        email?: string;
        items?: {
          title?: string;
          variant_sku?: string;
          variant?: { sku?: string };
        }[];
      }
    | undefined;

  const hasLinckupPack = order?.items?.some((item) => {
    const sku = item.variant_sku || item.variant?.sku || "";
    return sku === "LINCKUP-PACK-COMPTOIR" || item.title?.includes("Linckup");
  });

  if (!order?.email || !hasLinckupPack) {
    return;
  }

  const client = await getPool().connect();

  try {
    await client.query("begin");

    const existing = await client.query(
      "select id from linckup_merchants where customer_email = $1 limit 1",
      [order.email],
    );

    if (existing.rowCount && existing.rows[0]?.id) {
      logger.info(`Linckup workspace already exists for ${order.email}`);
      await client.query("commit");
      return;
    }

    const slugBase = slugify(order.email.split("@")[0] || "commerce");
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const merchant = await client.query<{ id: string }>(
      `insert into linckup_merchants
        (name, slug, customer_email, business_type, subscription_status, trial_ends_at, settings)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (customer_email) do nothing
       returning id`,
      [
        "Nouveau commerce Linckup",
        slug,
        order.email,
        "commerce",
        "trialing",
        createTrialEndsAt(),
        JSON.stringify({ source: "order.placed", order_id: data.id }),
      ],
    );

    if (!merchant.rowCount || !merchant.rows[0]?.id) {
      logger.info(`Linckup workspace already exists for ${order.email}`);
      await client.query("commit");
      return;
    }

    const merchantId = merchant.rows[0].id;
    const publicId = `${slug}-nfc`;

    await client.query(
      `insert into linckup_nfc_tags (public_id, merchant_id, status)
       values ($1, $2, 'active')
       on conflict (public_id) do nothing`,
      [publicId, merchantId],
    );

    await client.query(
      `insert into linckup_review_targets
        (merchant_id, platform, label, url, priority, review_count, enabled)
       values
        ($1, 'google', 'Google Avis', $2, 10, 0, true),
        ($1, 'tripadvisor', 'TripAdvisor', $3, 20, 0, true)`,
      [
        merchantId,
        process.env.DEFAULT_REVIEW_URL || "https://www.google.com",
        "https://www.tripadvisor.fr/",
      ],
    );

    await client.query("commit");
    logger.info(`Provisioned Linckup workspace for ${order.email}`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    logger.error(
      `Failed to provision Linckup workspace: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    client.release();
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
