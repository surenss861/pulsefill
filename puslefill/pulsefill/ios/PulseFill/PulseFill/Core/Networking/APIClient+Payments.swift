import Foundation

struct CreateSlotPaymentIntentResponse: Decodable {
    let clientSecret: String
    let paymentIntentId: String
}

private struct ClaimOpenSlotBody: Encodable {
    let paymentIntentId: String?
}

extension APIClient {
    func createSlotPaymentIntent(slotId: String) async throws -> CreateSlotPaymentIntentResponse {
        try await post(
            "/v1/open-slots/\(slotId)/payment-intent",
            body: EmptyJSON(),
            as: CreateSlotPaymentIntentResponse.self
        )
    }

    /// Extends the existing claim call with an optional payment intent id — omitted entirely for free slots.
    func claimSlot(slotId: String, paymentIntentId: String?) async throws -> ClaimOpenSlotResponse {
        try await post(
            "/v1/open-slots/\(slotId)/claim",
            body: ClaimOpenSlotBody(paymentIntentId: paymentIntentId),
            as: ClaimOpenSlotResponse.self
        )
    }
}
