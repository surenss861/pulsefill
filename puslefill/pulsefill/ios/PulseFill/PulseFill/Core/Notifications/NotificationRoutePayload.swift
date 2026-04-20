import Foundation

/// Normalized customer notification routing payload (supports APNs `aps` + custom `data` dict).
struct NotificationRoutePayload {
    let type: String?
    let kind: String?
    let offerId: String?
    let openSlotId: String?
    let claimId: String?

    init(userInfo: [AnyHashable: Any]) {
        var data = userInfo["data"] as? [String: Any]
        if data == nil, let s = userInfo["data"] as? String, let d = s.data(using: .utf8) {
            data = (try? JSONSerialization.jsonObject(with: d) as? [String: Any])
        }

        if let data {
            type = (data["type"] as? String)?.lowercased()
            kind = (data["kind"] as? String)?.lowercased()
            offerId = data["offer_id"] as? String ?? data["offerId"] as? String
            openSlotId = data["open_slot_id"] as? String ?? data["openSlotId"] as? String
            claimId = data["claim_id"] as? String ?? data["claimId"] as? String
        } else {
            type = (userInfo["type"] as? String)?.lowercased()
            kind = (userInfo["kind"] as? String)?.lowercased()
            offerId = userInfo["offer_id"] as? String ?? userInfo["offerId"] as? String
            openSlotId = userInfo["open_slot_id"] as? String ?? userInfo["openSlotId"] as? String
            claimId = userInfo["claim_id"] as? String ?? userInfo["claimId"] as? String
        }
    }

    /// Primary routing key: explicit `type` or legacy `kind`.
    var routeKey: String? {
        type ?? kind
    }
}
