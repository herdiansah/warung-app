import { describe, expect, it } from "vitest";
import { validateCheckoutItems } from "../src/domain/transaction";

describe("validateCheckoutItems", () => {
  it("accepts a checkout with unique products and positive whole quantities", () => {
    expect(validateCheckoutItems([
      { product_id: "rice", qty: 2 },
      { product_id: "noodles", qty: 1 },
    ])).toEqual([
      { product_id: "rice", qty: 2 },
      { product_id: "noodles", qty: 1 },
    ]);
  });

  it.each([
    [[], "Transaksi harus memiliki setidaknya satu item"],
    [[{ product_id: "rice", qty: 0 }], "Jumlah produk harus berupa bilangan bulat positif"],
    [[{ product_id: "rice", qty: -1 }], "Jumlah produk harus berupa bilangan bulat positif"],
    [[{ product_id: "rice", qty: 1.5 }], "Jumlah produk harus berupa bilangan bulat positif"],
    [[{ product_id: "rice", qty: 1 }, { product_id: "rice", qty: 1 }], "Produk tidak boleh muncul lebih dari sekali dalam transaksi"],
  ])("rejects invalid checkout input %#", (items, message) => {
    expect(() => validateCheckoutItems(items)).toThrow(message);
  });
});
