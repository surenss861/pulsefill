import Foundation

/// Human-first copy for operator mutations (slot actions, invites, create opening). Keeps `APIErrorCopy` for technical / conflict paths.
enum OperatorMutationFriendlyCopy {
    enum SlotMutation: Equatable {
        case sendOffers
        case retryOffers
        case confirmBooking
        case expireSlot
        case cancelSlot
        case saveNote
    }

    /// Primary toast / flash line for slot detail mutations (non-conflict).
    static func slotMutationUserMessage(for error: Error, mutation: SlotMutation?) -> String {
        if isOperatorActionConflict(error) {
            return APIErrorCopy.message(for: error)
        }
        let technical = APIErrorCopy.message(for: error)
        guard let mutation else { return technical }

        switch mutation {
        case .sendOffers, .retryOffers:
            return "Couldn’t send offers. Check that this opening is still open or offered, then try again."
        case .confirmBooking:
            return "Couldn’t confirm booking. Refresh the opening and try again."
        case .expireSlot:
            return "Couldn’t expire this opening. Try again in a moment."
        case .cancelSlot:
            return "Couldn’t cancel this opening. Try again in a moment."
        case .saveNote:
            return "Couldn’t save the internal note. Check your connection and try again."
        }
    }

    static func createOpeningFailed(_ error: Error) -> String {
        if isOperatorActionConflict(error) {
            return APIErrorCopy.message(for: error)
        }
        return "Couldn’t create this opening. Check the times and service, then try again."
    }

    static func createInviteFailed(_ error: Error) -> String {
        return "Couldn’t create invite. Check the email and try again."
    }

    static func revokeInviteFailed(_ error: Error) -> String {
        return "Couldn’t revoke invite. Try again in a moment."
    }

    static func listInlineActionFailed(for error: Error, kind: OperatorInlineActionKind) -> String {
        if isOperatorActionConflict(error) {
            return APIErrorCopy.message(for: error)
        }
        switch kind {
        case .sendOffers, .retryOffers:
            return "Couldn’t send offers from the list. Open the slot and try again."
        case .confirmBooking:
            return "Couldn’t confirm from the list. Open the slot and try again."
        }
    }

    private static func isOperatorActionConflict(_ error: Error) -> Bool {
        guard let apiErr = error as? APIError else { return false }
        if case let .structured(statusCode, code, _, _) = apiErr {
            return statusCode == 409 && code == "operator_action_not_allowed"
        }
        return false
    }
}
