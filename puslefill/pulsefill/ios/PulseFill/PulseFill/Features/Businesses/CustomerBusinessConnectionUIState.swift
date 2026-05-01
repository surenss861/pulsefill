import Foundation
import SwiftUI

/// Customer-safe connection state for directory business detail (not raw API strings).
enum CustomerBusinessConnectionUIState: Equatable {
    case publicJoin
    case requestAccess
    case inviteRequired
    case waitingForApproval
    case requestNotApproved
    case connectedNeedsStandby
    case standbyActive
    case unknown

    var title: String {
        switch self {
        case .publicJoin: "Join standby"
        case .requestAccess: "Request access"
        case .inviteRequired: "Invite required"
        case .waitingForApproval: "Waiting for approval"
        case .requestNotApproved: "Request not approved"
        case .connectedNeedsStandby: "Set up standby"
        case .standbyActive: "Standby active"
        case .unknown: "Connection status unavailable"
        }
    }

    var message: String {
        switch self {
        case .publicJoin:
            return "Join this business so you can set standby preferences and receive matching openings."
        case .requestAccess:
            return "Ask to join this business’s standby pool. You’ll be able to set preferences after approval."
        case .inviteRequired:
            return "This business only accepts standby customers by invite."
        case .waitingForApproval:
            return "Your request was sent. You’ll be able to set standby preferences once the business approves it."
        case .requestNotApproved:
            return "This business is not accepting your standby request right now."
        case .connectedNeedsStandby:
            return "You’re connected. Set your preferences so PulseFill knows which openings to show you."
        case .standbyActive:
            return "You’re on standby for this business. You can edit your preferences anytime."
        case .unknown:
            return "Refresh this screen or check again shortly."
        }
    }

    /// Small status pill at top of the connection card (not offer-specific wording).
    var statusChipLabel: String {
        switch self {
        case .publicJoin: "Open to join"
        case .requestAccess: "Approval required"
        case .inviteRequired: "Invite required"
        case .waitingForApproval: "Pending approval"
        case .requestNotApproved: "Not connected"
        case .connectedNeedsStandby: "Connected"
        case .standbyActive: "Standby on"
        case .unknown: "Status unavailable"
        }
    }

    var statusChipTone: CustomerStatusPillTone {
        switch self {
        case .standbyActive: .success
        case .waitingForApproval, .requestAccess: .warning
        case .requestNotApproved, .inviteRequired: .onDarkNeutral
        case .connectedNeedsStandby: .onDarkEmber
        case .publicJoin: .onDarkEmber
        case .unknown: .onDarkNeutral
        }
    }

    var sectionVariant: PFCustomerSectionVariant {
        switch self {
        case .waitingForApproval, .requestAccess: .attention
        case .standbyActive: .elevated
        case .requestNotApproved, .inviteRequired: .quiet
        default: .default
        }
    }

    static func resolve(
        accessModeRaw: String?,
        relationship: CustomerRelationshipState?
    ) -> CustomerBusinessConnectionUIState {
        let access = accessModeRaw?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? "private"

        if let rel = relationship {
            let membership = rel.membershipStatus.lowercased()
            let request = rel.requestStatus.lowercased()
            let standby = rel.standbyStatus.lowercased()

            if membership == "active" {
                if standby == "active" {
                    return .standbyActive
                }
                return .connectedNeedsStandby
            }
            if request == "pending" {
                return .waitingForApproval
            }
            if request == "declined", membership != "active" {
                return .requestNotApproved
            }
        }

        switch access {
        case "public":
            return .publicJoin
        case "request_to_join":
            return .requestAccess
        default:
            return .inviteRequired
        }
    }
}

// MARK: - Access policy copy (overview)

enum CustomerBusinessAccessPolicyCopy {
    static func headline(for accessModeRaw: String?) -> String {
        switch accessModeRaw?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? "private" {
        case "public":
            return "Public standby"
        case "request_to_join":
            return "Request required"
        default:
            return "Invite only"
        }
    }

    static func detail(for accessModeRaw: String?) -> String {
        switch accessModeRaw?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? "private" {
        case "public":
            return "Customers can join standby directly."
        case "request_to_join":
            return "This business reviews standby requests before customers can set preferences."
        default:
            return "This business connects with customers by invite."
        }
    }

    /// Short label for directory list rows (no raw mode strings).
    static func listChipLabel(for accessModeRaw: String?) -> String {
        switch accessModeRaw?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? "private" {
        case "public":
            return "Open to join"
        case "request_to_join":
            return "Request access"
        default:
            return "Invite required"
        }
    }
}
