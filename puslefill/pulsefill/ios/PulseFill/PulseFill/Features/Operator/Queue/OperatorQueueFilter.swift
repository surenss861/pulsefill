import Foundation

enum OperatorQueueFilter: String, CaseIterable, Identifiable {
    case all = "All"
    case needsAction = "Needs action"
    case review = "Review"
    case resolved = "Resolved"

    var id: String { rawValue }
}
