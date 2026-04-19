import Foundation

/// Human-friendly labels for standby UI, with stable fallbacks when the API hasn’t resolved yet.
enum StandbyDisplayName {
    static func business(businessId: String, resolvedName: String?) -> String {
        if let name = resolvedName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        return shortRef(businessId)
    }

    static func service(serviceId: String?, resolvedName: String?) -> String {
        let sid = serviceId?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if sid.isEmpty { return "—" }
        if let name = resolvedName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        return shortRef(sid)
    }

    static func shortRef(_ uuid: String) -> String {
        let t = uuid.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return "—" }
        guard t.count >= 8 else { return t }
        return "\(t.prefix(8))…"
    }
}
