import Foundation

enum OperatorSlotsFilter: String, CaseIterable, Identifiable {
    case all = "All"
    case open = "Open"
    case offered = "Offered"
    case claimed = "Claimed"
    case booked = "Booked"
    case expired = "Expired"
    case cancelled = "Cancelled"

    var id: String { rawValue }

    func matches(status: String) -> Bool {
        switch self {
        case .all: true
        default: status.lowercased() == rawValue.lowercased()
        }
    }
}
