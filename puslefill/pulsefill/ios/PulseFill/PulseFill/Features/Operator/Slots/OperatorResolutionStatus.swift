import Foundation

enum OperatorResolutionStatus: String, CaseIterable, Identifiable {
    case none
    case handledManually = "handled_manually"
    case noRetryNeeded = "no_retry_needed"
    case customerContacted = "customer_contacted"
    case providerUnavailable = "provider_unavailable"
    case ignore

    var id: String { rawValue }

    var label: String {
        switch self {
        case .none: return "None"
        case .handledManually: return "Handled manually"
        case .noRetryNeeded: return "No retry needed"
        case .customerContacted: return "Customer contacted"
        case .providerUnavailable: return "Provider unavailable"
        case .ignore: return "Ignore"
        }
    }

    static func from(apiValue: String?) -> OperatorResolutionStatus {
        guard let apiValue, let s = OperatorResolutionStatus(rawValue: apiValue) else { return .none }
        return s
    }
}
