export function formatMoney(amount, currency = "USD") {
  const localeByCurrency = {
    USD: "en-US",
    EUR: "nl-NL",
    GBP: "en-GB",
  };

  const safeCurrency = localeByCurrency[currency] ? currency : "USD";
  const locale = localeByCurrency[safeCurrency];

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}
