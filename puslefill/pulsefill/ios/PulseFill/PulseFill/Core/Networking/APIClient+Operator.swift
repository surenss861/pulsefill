import Foundation

private struct OperatorEmptyPOSTBody: Encodable {}

extension APIClient {
    func getMorningRecoveryDigest() async throws -> MorningRecoveryDigestResponse {
        try await get("/v1/businesses/mine/morning-recovery-digest", as: MorningRecoveryDigestResponse.self)
    }

    /// Non-throwing wrapper so the queue screen can load digest in parallel without failing the whole load.
    func getMorningRecoveryDigestIfAvailable() async -> MorningRecoveryDigestResponse? {
        try? await getMorningRecoveryDigest()
    }

    func getOperatorActionQueue() async throws -> OperatorActionQueueResponse {
        try await get("/v1/businesses/mine/action-queue", as: OperatorActionQueueResponse.self)
    }

    func getStaffOpenSlots(limit: Int? = nil, offset: Int? = nil) async throws -> OpenSlotsListAPIResponse {
        var params: [String] = []
        if let limit { params.append("limit=\(limit)") }
        if let offset { params.append("offset=\(offset)") }
        let path = params.isEmpty ? "/v1/open-slots/mine" : "/v1/open-slots/mine?\(params.joined(separator: "&"))"
        return try await get(path, as: OpenSlotsListAPIResponse.self)
    }

    /// Walks pagination until exhausted so aggregate consumers (Today, Claims bucketing) keep
    /// seeing the full collection. Bounded by `maxPages` against a runaway fetch loop.
    func getAllStaffOpenSlots(pageLimit: Int = 200, maxPages: Int = 25) async throws -> [StaffOpenSlotListRow] {
        var all: [StaffOpenSlotListRow] = []
        var offset = 0
        for _ in 0..<maxPages {
            let page = try await getStaffOpenSlots(limit: pageLimit, offset: offset)
            all.append(contentsOf: page.openSlots)
            guard let hasMore = page.pagination?.hasMore, hasMore, !page.openSlots.isEmpty else { break }
            offset += pageLimit
        }
        return all
    }

    func createOpenSlot(body: CreateOpenSlotRequestBody) async throws -> CreateOpenSlotAPIResponse {
        try await post("/v1/open-slots", body: body, as: CreateOpenSlotAPIResponse.self)
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

    func expireOpenSlot(slotId: String) async throws -> SimpleOkResponse {
        try await post("/v1/open-slots/\(slotId)/expire", body: OperatorEmptyPOSTBody(), as: SimpleOkResponse.self)
    }

    func cancelOpenSlot(slotId: String) async throws -> SimpleOkResponse {
        try await post("/v1/open-slots/\(slotId)/cancel", body: OperatorEmptyPOSTBody(), as: SimpleOkResponse.self)
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
