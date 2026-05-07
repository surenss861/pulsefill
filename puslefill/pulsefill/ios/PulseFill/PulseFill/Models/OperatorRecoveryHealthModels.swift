import Foundation

/// `GET /v1/businesses/mine/recovery-health` — optional; fields are loose so minor API drift still decodes.
struct OperatorRecoveryHealthResponse: Codable, Sendable, Equatable {
    let status: String?
    let headline: String?
    let message: String?
    let topFix: String?

    /// True when the payload has enough copy to drive the Today card without falling back to client-side synthesis.
    var isUsableForDisplay: Bool {
        let h = headline?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let m = message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return !h.isEmpty && !m.isEmpty
    }
}
