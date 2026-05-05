import Foundation

/// Human-friendly labels for standby UI, with stable fallbacks when the API hasn’t resolved yet.
enum StandbyDisplayName {
    static func business(businessId: String, resolvedName: String?) -> String {
        if let name = resolvedName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        let bid = businessId.trimmingCharacters(in: .whitespacesAndNewlines)
        if bid.isEmpty { return "—" }
        return "This business"
    }

    static func service(serviceId: String?, resolvedName: String?) -> String {
        let sid = serviceId?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if sid.isEmpty { return "Any service" }
        if let name = resolvedName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        return "Selected visit type"
    }

    static func shortRef(_ uuid: String) -> String {
        let t = uuid.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return "—" }
        guard t.count >= 8 else { return t }
        return "\(t.prefix(8))…"
    }
}
