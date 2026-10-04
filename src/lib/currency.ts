export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimalPlaces: 2 },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', decimalPlaces: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
  SGD: { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', decimalPlaces: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2 },
};

// Standard FX exchange rates indexed to USD (1 USD = X target currency)
export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 151.5,
  INR: 83.2,
  SGD: 1.35,
  CHF: 0.90,
};

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces,
    }).format(amount || 0);
  } catch {
    return `${currency.symbol}${(amount || 0).toFixed(currency.decimalPlaces)}`;
  }
}

export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || '$';
}

export function getExchangeRate(fromCurrency: string = 'USD', toCurrency: string = 'USD'): number {
  const fromRate = FX_RATES_TO_USD[fromCurrency] || 1.0;
  const toRate = FX_RATES_TO_USD[toCurrency] || 1.0;
  return toRate / fromRate;
}

export function convertCurrency(amount: number, fromCurrency: string = 'USD', toCurrency: string = 'USD'): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}
