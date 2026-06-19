export type Currency = {
  code: string
  name: string
  symbol: string
  flag: string
  decimals: number
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', decimals: 2 },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱', decimals: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', decimals: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', decimals: 0 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', decimals: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimals: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimals: 0 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', decimals: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', decimals: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimals: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', decimals: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', decimals: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimals: 0 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimals: 2 },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', decimals: 0 },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', flag: '🇨🇱', decimals: 0 },
]

// Simulated mid-market rates (vs USD)
const RATES_VS_USD: Record<string, number> = {
  EUR: 0.92, USD: 1, GBP: 0.79, CAD: 1.36, AUD: 1.53, JPY: 149.5,
  CHF: 0.88, INR: 83.2, MXN: 17.1, BRL: 4.97, SGD: 1.34, HKD: 7.82,
  NOK: 10.5, SEK: 10.4, DKK: 6.89, PLN: 3.98, CZK: 23.1, HUF: 355,
  RON: 4.58, BGN: 1.80, TRY: 30.5, ZAR: 18.7, NZD: 1.63, THB: 35.1,
  MYR: 4.71, PHP: 56.4, IDR: 15650, AED: 3.67, SAR: 3.75, EGP: 30.9,
  KES: 148.5, GHS: 12.3, NGN: 780, PKR: 278, BDT: 110, VND: 24350,
  KRW: 1330, CNY: 7.24, TWD: 31.8, CLP: 895,
}

// Fee structure (percentage of send amount)
const FEE_STRUCTURE: Record<string, number> = {
  default: 0.0041,
  'USD-EUR': 0.0041, 'EUR-USD': 0.0041,
  'GBP-USD': 0.0038, 'USD-GBP': 0.0038,
  'USD-INR': 0.002, 'GBP-INR': 0.0025,
}

export function getRate(from: string, to: string): number {
  const fromUSD = RATES_VS_USD[from] ?? 1
  const toUSD = RATES_VS_USD[to] ?? 1
  return toUSD / fromUSD
}

export function getFeeRate(from: string, to: string): number {
  return FEE_STRUCTURE[`${from}-${to}`] ?? FEE_STRUCTURE.default
}

export function calculateTransfer(amount: number, from: string, to: string) {
  const rate = getRate(from, to)
  const feeRate = getFeeRate(from, to)
  const fee = amount * feeRate
  const amountAfterFee = amount - fee
  const received = amountAfterFee * rate
  return { rate, fee, received, amountAfterFee }
}

export function formatCurrency(amount: number, currency: string): string {
  const curr = CURRENCIES.find(c => c.code === currency)
  if (!curr) return `${amount.toFixed(2)} ${currency}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals,
  }).format(amount)
}

export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}
