import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({
    locales: [
      { code: "fr", name: "Francais" },
      { code: "en", name: "English" },
    ],
  })
}
