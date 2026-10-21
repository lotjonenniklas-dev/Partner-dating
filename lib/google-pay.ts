export const LIKE_PASS_PRICE = "2.99"
export const LIKE_PASS_CURRENCY = "EUR"

export type GooglePayConfig = {
  environment: "TEST" | "PRODUCTION"
  gateway: string
  gatewayMerchantId: string
  merchantId: string
  merchantName: string
}

type Env = Record<string, string | undefined>

export function googlePayConfig(
  env: Env = {
    NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT,
    NEXT_PUBLIC_GOOGLE_PAY_GATEWAY: process.env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY,
    NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID: process.env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID,
    NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID,
  },
): GooglePayConfig {
  return {
    environment: env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT === "PRODUCTION" ? "PRODUCTION" : "TEST",
    gateway: env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY || "example",
    gatewayMerchantId: env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID || "exampleGatewayMerchantId",
    merchantId: env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || "",
    merchantName: "Partner",
  }
}

function cardMethod(config: GooglePayConfig) {
  return {
    type: "CARD",
    parameters: {
      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
      allowedCardNetworks: ["MASTERCARD", "VISA"],
    },
    tokenizationSpecification: {
      type: "PAYMENT_GATEWAY",
      parameters: {
        gateway: config.gateway,
        gatewayMerchantId: config.gatewayMerchantId,
      },
    },
  }
}

export function readyToPayRequest(config: GooglePayConfig) {
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [cardMethod(config)],
  }
}

export function paymentRequest(config: GooglePayConfig) {
  const merchantInfo: { merchantName: string; merchantId?: string } = {
    merchantName: config.merchantName,
  }
  if (config.environment === "PRODUCTION" && config.merchantId) {
    merchantInfo.merchantId = config.merchantId
  }
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [cardMethod(config)],
    merchantInfo,
    transactionInfo: {
      totalPriceStatus: "FINAL" as const,
      totalPrice: LIKE_PASS_PRICE,
      currencyCode: LIKE_PASS_CURRENCY,
      countryCode: "FI",
    },
  }
}

export function paymentToken(result: unknown) {
  if (!result || typeof result !== "object") return null
  const token = (result as { paymentMethodData?: { tokenizationData?: { token?: unknown } } })
    .paymentMethodData?.tokenizationData?.token
  return typeof token === "string" && token.trim() ? token.trim() : null
}

export function isGooglePayCancel(error: unknown) {
  if (!error || typeof error !== "object") return false
  return (error as { statusCode?: unknown }).statusCode === "CANCELED"
}

export function acceptsGooglePayToken(config: GooglePayConfig, token: string) {
  if (!token.trim()) return false
  if (config.environment === "PRODUCTION" && config.gateway === "example") return false
  if (config.environment === "PRODUCTION" && !config.merchantId) return false
  // In TEST mode, accept any token (for testing without real Stripe)
  if (config.environment === "TEST") return true
  // In PRODUCTION, only accept if Stripe is properly configured
  return config.gateway === "stripe" && config.gatewayMerchantId.startsWith("acct_")
}
