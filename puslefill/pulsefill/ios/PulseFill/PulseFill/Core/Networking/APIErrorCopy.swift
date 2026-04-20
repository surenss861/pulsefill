import Foundation

enum APIErrorCopy {
    /// Operator- and customer-facing copy; prefers stable `error.code` when present.
    static func message(for error: Error) -> String {
        if let api = error as? APIError {
            if case let .structured(_, code, message, _) = api {
                if let code, let mapped = mapOperatorActionCode(code) {
                    return mapped
                }
                return message
            }
            return api.localizedDescription
        }

        let text = error.localizedDescription.lowercased()

        if text.contains("slot already claimed") || text.contains("lost_race") || text.contains("claim_rejected") {
            return "Someone else claimed this opening first."
        }

        if text.contains("slot unavailable") || text.contains("no longer available") || text.contains("not_found") {
            return "This opening is no longer available."
        }

        if text.contains("missing bearer") || text.contains("invalid token") || text.contains("unauthorized") {
            return "Sign in again to continue."
        }

        if text.contains("network") || text.contains("timed out") || text.contains("could not connect")
            || text.contains("connection") {
            return "We couldn’t reach PulseFill right now. Try again."
        }

        return "Something went wrong. Please try again."
    }

    private static func mapOperatorActionCode(_ code: String) -> String? {
        switch code {
        case "claim_mismatch":
            return "That claim changed before confirmation. Refresh and review."
        case "slot_not_claimed":
            return "This opening is no longer awaiting confirmation."
        case "slot_terminal_state":
            return "This opening can no longer be confirmed."
        case "slot_already_claimed":
            return "This opening already has a claimant."
        case "slot_already_booked":
            return "This opening has already been confirmed."
        case "slot_expired":
            return "This opening has expired."
        case "slot_cancelled":
            return "This opening was cancelled."
        case "not_found":
            return "This opening no longer exists."
        case "forbidden":
            return "You don’t have access to do that."
        case "invalid_request":
            return "That action couldn’t be completed."
        case "server_error":
            return "Something went wrong. Try again."
        default:
            return nil
        }
    }
}
