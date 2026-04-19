import Foundation

enum OperatorClaimsFilter: String, CaseIterable, Identifiable {
    case all = "All"
    case awaiting = "Awaiting"
    case confirmed = "Confirmed"

    var id: String { rawValue }
}
