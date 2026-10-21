import {
  acceptsGooglePayToken,
  googlePayConfig,
  isGooglePayCancel,
  LIKE_PASS_CURRENCY,
  LIKE_PASS_PRICE,
  paymentRequest,
  paymentToken,
} from "../lib/google-pay.ts"
import { isGoogleSession, previewSession } from "../lib/google-session.ts"

const test = googlePayConfig({})
const request = paymentRequest(test)
if (request.transactionInfo.totalPrice !== LIKE_PASS_PRICE) throw new Error("price")
if (request.transactionInfo.currencyCode !== LIKE_PASS_CURRENCY) throw new Error("currency")
if (request.transactionInfo.countryCode !== "FI") throw new Error("country")
if ("merchantId" in request.merchantInfo) throw new Error("test merchant id")
if (!acceptsGooglePayToken(test, "tok_test")) throw new Error("test token")
if (acceptsGooglePayToken(test, "  ")) throw new Error("blank token")

const production = googlePayConfig({
  NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT: "PRODUCTION",
  NEXT_PUBLIC_GOOGLE_PAY_GATEWAY: "example",
  NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID: "merchant",
})
if (acceptsGooglePayToken(production, "tok_live")) throw new Error("example gateway must not settle")

const live = googlePayConfig({
  NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT: "PRODUCTION",
  NEXT_PUBLIC_GOOGLE_PAY_GATEWAY: "stripe",
  NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID: "acct",
  NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID: "merchant",
})
const liveRequest = paymentRequest(live)
if (liveRequest.merchantInfo.merchantId !== "merchant") throw new Error("merchant")
if (acceptsGooglePayToken(live, "tok_live")) throw new Error("live charge is not settled here")

if (paymentToken({ paymentMethodData: { tokenizationData: { token: " abc " } } }) !== "abc") {
  throw new Error("token")
}
if (paymentToken({}) !== null) throw new Error("missing token")
if (!isGooglePayCancel({ statusCode: "CANCELED" })) throw new Error("cancel")
if (isGooglePayCancel({ statusCode: "ERROR" })) throw new Error("other")

const preview = previewSession()
if (!isGoogleSession(preview) || preview.source !== "preview") throw new Error("preview")
if (isGoogleSession({ ...preview, email: 1 })) throw new Error("bad session")

console.log("google pay ok")
