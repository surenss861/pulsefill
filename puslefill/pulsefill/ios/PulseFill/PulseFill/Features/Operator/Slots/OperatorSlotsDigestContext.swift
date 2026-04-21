import Foundation

/// Client-side filter when drilling in from morning digest (matches web “filtered slots” handoff).
struct OperatorSlotsDigestContext: Equatable {
    let slotIds: [String]
    let title: String
    let subtitle: String?
}
