export function formatCurrency(amount: number) {
  return (
    "R " +
    new Intl.NumberFormat("en-ZA", {
      maximumFractionDigits: 0,
    }).format(amount)
  );
}