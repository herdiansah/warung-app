export class CheckoutValidationError extends Error {}

export type CheckoutItem = {
  product_id: string;
  qty: number;
};

export function validateCheckoutItems(value: unknown): CheckoutItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CheckoutValidationError("Transaksi harus memiliki setidaknya satu item");
  }

  const productIds = new Set<string>();

  return value.map((item) => {
    if (!item || typeof item !== "object") {
      throw new CheckoutValidationError("Item transaksi tidak valid");
    }

    const { product_id, qty } = item as Record<string, unknown>;
    if (typeof product_id !== "string" || product_id.trim() === "") {
      throw new CheckoutValidationError("Produk transaksi tidak valid");
    }
    if (!Number.isInteger(qty) || (qty as number) <= 0) {
      throw new CheckoutValidationError("Jumlah produk harus berupa bilangan bulat positif");
    }
    if (productIds.has(product_id)) {
      throw new CheckoutValidationError("Produk tidak boleh muncul lebih dari sekali dalam transaksi");
    }

    productIds.add(product_id);
    return { product_id, qty: qty as number };
  });
}
