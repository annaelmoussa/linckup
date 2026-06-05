import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function linckup_product_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storefrontUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:8000"

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: {
      handle: "pack-linckup-comptoir",
    },
  })

  if (existingProducts.length > 0) {
    logger.info("Linckup product already exists. Skipping.")
    return
  }

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  })

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })

  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Packs NFC",
          is_active: true,
        },
      ],
    },
  })

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Pack Linckup Comptoir",
          category_ids: [categories[0].id],
          description:
            "Plaque NFC et QR code Linckup prete a poser pour collecter plus d'avis Google et TripAdvisor, avec activation du routage intelligent SaaS.",
          handle: "pack-linckup-comptoir",
          weight: 250,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfiles[0].id,
          images: [
            {
              url: `${storefrontUrl}/linckup/product-plaque.png`,
            },
            {
              url: `${storefrontUrl}/linckup/checkout-scene.png`,
            },
          ],
          options: [
            {
              title: "Pack",
              values: ["Comptoir"],
            },
          ],
          variants: [
            {
              title: "Comptoir",
              sku: "LINCKUP-PACK-COMPTOIR",
              manage_inventory: false,
              options: {
                Pack: "Comptoir",
              },
              prices: [
                {
                  amount: 25,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: salesChannels.map((channel) => ({ id: channel.id })),
        },
      ],
    },
  })

  logger.info("Linckup product seeded.")
}
