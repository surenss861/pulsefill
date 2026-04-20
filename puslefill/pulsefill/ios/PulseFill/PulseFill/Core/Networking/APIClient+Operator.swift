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

    func getOperatorOpsBreakdown() async throws -> OperatorOpsBreakdownResponse {
        try await get("/v1/businesses/mine/ops-breakdown", as: OperatorOpsBreakdownResponse.self)
    }

    func getOperatorDeliveryReliability() async throws -> OperatorDeliveryReliabilityResponse {
        try await get("/v1/businesses/mine/delivery-reliability", as: OperatorDeliveryReliabilityResponse.self)
    }

    func getBusinessNamedProviders() async throws -> [BusinessNamedRow] {
        try await get("/v1/providers", as: [BusinessNamedRow].self)
    }

    func getBusinessNamedLocations() async throws -> [BusinessNamedRow] {
        try await get("/v1/locations", as: [BusinessNamedRow].self)
    }

    func getBusinessNamedServices() async throws -> [BusinessNamedRow] {
        try await get("/v1/services", as: [BusinessNamedRow].self)
    }

    func sendOffers(slotId: String) async throws -> SendOffersAPIResponse {
        try await post("/v1/open-slots/\(slotId)/send-offers", body: SendOffersRequest(), as: SendOffersAPIResponse.self)
    }

    func confirmOpenSlotClaim(slotId: String, claimId: String) async throws -> ConfirmOpenSlotResponse {
        try await post(
            "/v1/open-slots/\(slotId)/confirm",
            body: ConfirmClaimRequest(claimId: claimId),
            as: ConfirmOpenSlotResponse.self
        )
    }

    func updateOperatorSlotNote(slotId: String, internalNote: String, resolutionStatus: String) async throws -> UpdateOperatorSlotNoteResponse {
        try await patch(
            "/v1/open-slots/\(slotId)/internal-note",
            body: UpdateOperatorSlotNoteBody(internalNote: internalNote, resolutionStatus: resolutionStatus),
            as: UpdateOperatorSlotNoteResponse.self
        )
    }
}
