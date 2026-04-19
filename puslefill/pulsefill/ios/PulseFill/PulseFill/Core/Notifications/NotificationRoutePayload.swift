import Foundation

struct NotificationRoutePayload {
    let kind: String?
    let offerId: String?
    let openSlotId: String?

    init(userInfo: [AnyHashable: Any]) {
        if let data = userInfo["data"] as? [String: Any] {
            kind = data["kind"] as? String
            offerId = data["offerId"] as? String
            openSlotId = data["openSlotId"] as? String
        } else {
            kind = userInfo["kind"] as? String
            offerId = userInfo["offerId"] as? String
            openSlotId = userInfo["openSlotId"] as? String
        }
    }
}
