const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return eur.format(amount);
}
