import Foundation

enum APIErrorCopy {
    static func message(for error: Error) -> String {
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
}
