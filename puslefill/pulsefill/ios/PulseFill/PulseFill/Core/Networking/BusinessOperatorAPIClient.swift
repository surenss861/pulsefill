import Foundation

/// Typed entry point for **staff / Business mode** HTTP calls.
/// Customer surfaces should keep using `APIClient` + `APIClient+Customer` directly.
@MainActor
struct BusinessOperatorAPIClient {
    let underlying: APIClient

    /// Parallel bundle for the Business **Today** tab.
    func loadBusinessTodayDashboard() async throws -> BusinessTodayDashboardPayload {
        async let daily = labeled("GET /v1/businesses/mine/daily-ops-summary") {
            try await underlying.getOperatorDailyOpsSummary()
        }
        async let queue = labeled("GET /v1/businesses/mine/action-queue") {
            try await underlying.getOperatorActionQueue()
        }
        async let slots = labeled("GET /v1/open-slots/mine") {
            try await underlying.getStaffOpenSlots()
        }
        async let digest = underlying.getMorningRecoveryDigestIfAvailable()
        async let recoveryHealth = underlying.getOperatorRecoveryHealthIfAvailable()

        let dailyRes = try await daily
        let queueRes = try await queue
        let slotsRes = try await slots
        let digestRes = await digest
        let recoveryRes = await recoveryHealth

        return BusinessTodayDashboardPayload(
            daily: dailyRes,
            queue: queueRes,
            openSlots: slotsRes.openSlots,
            morningDigest: digestRes,
            recoveryHealth: recoveryRes
        )
    }

    private func labeled<T>(_ endpoint: String, _ work: () async throws -> T) async throws -> T {
        do {
            return try await work()
        } catch let labeled as LabeledAPIFailure {
            throw labeled
        } catch {
            throw LabeledAPIFailure(endpoint: endpoint, underlying: error)
        }
    }

    // MARK: - Openings / slot actions (used beyond Today; keeps operator naming in one place)

    func listMyOpenSlots() async throws -> OpenSlotsListAPIResponse {
        try await underlying.getStaffOpenSlots()
    }

    func openSlotDetail(slotId: String) async throws -> OpenSlotDetailAPIResponse {
        try await underlying.getOpenSlotDetail(slotId: slotId)
    }

    func sendOffers(slotId: String) async throws -> SendOffersAPIResponse {
        try await underlying.sendOffers(slotId: slotId)
    }

    func confirmOpenSlotClaim(slotId: String, claimId: String) async throws -> ConfirmOpenSlotResponse {
        try await underlying.confirmOpenSlotClaim(slotId: slotId, claimId: claimId)
    }

    func expireOpenSlot(slotId: String) async throws -> SimpleOkResponse {
        try await underlying.expireOpenSlot(slotId: slotId)
    }

    func cancelOpenSlot(slotId: String) async throws -> SimpleOkResponse {
        try await underlying.cancelOpenSlot(slotId: slotId)
    }

    func openSlotTimeline(slotId: String) async throws -> TimelineAPIResponse {
        try await underlying.getSlotTimeline(slotId: slotId)
    }

    func openSlotNotificationLogs(slotId: String) async throws -> NotificationLogsAPIResponse {
        try await underlying.getSlotNotificationLogs(slotId: slotId)
    }

    func updateOpenSlotInternalNote(
        slotId: String,
        internalNote: String,
        resolutionStatus: String
    ) async throws -> UpdateOperatorSlotNoteResponse {
        try await underlying.updateOperatorSlotNote(
            slotId: slotId,
            internalNote: internalNote,
            resolutionStatus: resolutionStatus
        )
    }

    func operatorCustomerContext(customerId: String) async throws -> OperatorCustomerContextResponse {
        try await underlying.getOperatorCustomerContext(customerId: customerId)
    }

    // MARK: - Customers / invites (staff)

    func listOperatorCustomerInvites() async throws -> StaffCustomerInvitesListResponse {
        try await underlying.listStaffCustomerInvites()
    }

    func createCustomerInvite(_ body: CreateStaffCustomerInviteBody) async throws -> StaffCustomerInviteListItemDTO {
        try await underlying.createStaffCustomerInvite(body: body)
    }

    func revokeCustomerInvite(inviteId: String) async throws -> StaffCustomerInviteListItemDTO {
        try await underlying.revokeStaffCustomerInvite(inviteId: inviteId)
    }

    // MARK: - Reference data (filters)

    func namedProviders() async throws -> [BusinessNamedRow] {
        try await underlying.getBusinessNamedProviders()
    }

    func namedLocations() async throws -> [BusinessNamedRow] {
        try await underlying.getBusinessNamedLocations()
    }

    func namedServices() async throws -> [BusinessNamedRow] {
        try await underlying.getBusinessNamedServices()
    }

    func listPendingStandbyRequests() async throws -> StaffStandbyRequestsListResponse {
        try await underlying.listStaffStandbyRequests(status: "pending")
    }

    func approveStandbyRequest(requestId: String) async throws -> StaffStandbyRequestReviewResponse {
        try await underlying.approveStaffStandbyRequest(requestId: requestId)
    }

    func declineStandbyRequest(requestId: String) async throws -> StaffStandbyRequestReviewResponse {
        try await underlying.declineStaffStandbyRequest(requestId: requestId)
    }

    func createOpenSlot(_ body: CreateOpenSlotRequestBody) async throws -> CreateOpenSlotAPIResponse {
        try await underlying.createOpenSlot(body: body)
    }
}

struct BusinessTodayDashboardPayload: Sendable {
    let daily: OperatorDailyOpsSummaryResponse
    let queue: OperatorActionQueueResponse
    let openSlots: [StaffOpenSlotListRow]
    let morningDigest: MorningRecoveryDigestResponse?
    let recoveryHealth: OperatorRecoveryHealthResponse?
}
