import Foundation

extension APIClient {
    func getOperatorActionQueue() async throws -> OperatorActionQueueResponse {
        try await get("/v1/businesses/mine/action-queue", as: OperatorActionQueueResponse.self)
    }

    func getStaffOpenSlots() async throws -> OpenSlotsListAPIResponse {
        try await get("/v1/open-slots/mine", as: OpenSlotsListAPIResponse.self)
    }

    func getOpenSlotDetail(slotId: String) async throws -> OpenSlotDetailAPIResponse {
        try await get("/v1/open-slots/\(slotId)", as: OpenSlotDetailAPIResponse.self)
    }

    func getSlotTimeline(slotId: String) async throws -> TimelineAPIResponse {
        try await get("/v1/open-slots/\(slotId)/timeline", as: TimelineAPIResponse.self)
    }

    func getSlotNotificationLogs(slotId: String) async throws -> NotificationLogsAPIResponse {
        try await get("/v1/open-slots/\(slotId)/notification-logs", as: NotificationLogsAPIResponse.self)
    }

    func sendOffers(slotId: String) async throws -> SendOffersAPIResponse {
        try await post("/v1/open-slots/\(slotId)/send-offers", body: SendOffersRequest(), as: SendOffersAPIResponse.self)
    }

    func confirmOpenSlotClaim(slotId: String, claimId: String) async throws -> OkResponse {
        try await post(
            "/v1/open-slots/\(slotId)/confirm",
            body: ConfirmClaimRequest(claimId: claimId),
            as: OkResponse.self
        )
    }
}
