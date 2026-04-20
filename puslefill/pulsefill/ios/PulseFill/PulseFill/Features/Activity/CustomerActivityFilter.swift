import Foundation

enum CustomerActivityFilter: String, CaseIterable, Identifiable {
    case all = "All"
    case offers = "Offers"
    case claims = "Claims"
    case confirmed = "Confirmed"
    case missed = "Missed"

    var id: String { rawValue }

    func matches(_ item: CustomerActivityItem) -> Bool {
        guard let kind = CustomerEventKind(rawKind: item.kind) else {
            return self == .all
        }
        switch self {
        case .all:
            return true
        case .offers:
            return kind == .offerReceived || kind == .offerExpiringSoon
        case .claims:
            return kind == .claimSubmitted || kind == .claimPendingConfirmation || kind == .claimUnavailable
        case .confirmed:
            return kind == .bookingConfirmed
        case .missed:
            return kind == .missedOpportunity || kind == .offerExpired || kind == .claimUnavailable
        }
    }
}
