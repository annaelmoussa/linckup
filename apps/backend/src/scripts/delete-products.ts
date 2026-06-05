import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ExecArgs } from "@medusajs/framework/types"

export default async function myScript({ container }: ExecArgs) {
  const productModuleService = container.resolve("product")
  
  const products = await productModuleService.listProducts()
  
  console.log("Current products:")
  products.forEach(p => console.log(`- ${p.title} (${p.id})`))
  
  const toDelete = products.filter(p => !p.title.toLowerCase().includes("nfc"))
  
  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} products...`)
    await productModuleService.deleteProducts(toDelete.map(p => p.id))
    console.log("Deleted.")
  } else {
    console.log("No products to delete.")
  }
}