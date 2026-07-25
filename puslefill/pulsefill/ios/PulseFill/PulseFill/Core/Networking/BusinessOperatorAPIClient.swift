import Foundation

/// Typed entry point for **staff / Business mode** HTTP calls.
/// Customer surfaces should keep using `APIClient` + `APIClient+Customer` directly.
@MainActor
struct BusinessOperatorAPIClient {
    let underlying: APIClient

    /// Parallel bundle for the Business **Today** tab. Each section fails
    /// independently — one card's outage must not blank the whole tab, and
    /// the view is already built to render whichever sections came back.
    func loadBusinessTodayDashboard() async throws -> BusinessTodayDashboardPayload {
        async let daily = labeledResult("GET /v1/businesses/mine/daily-ops-summary") {
            try await underlying.getOperatorDailyOpsSummary()
        }
        async let queue = labeledResult("GET /v1/businesses/mine/action-queue") {
            try await underlying.getOperatorActionQueue()
        }
        async let slots = labeledResult("GET /v1/open-slots/mine") {
            try await underlying.getAllStaffOpenSlots()
        }
        async let digest = underlying.getMorningRecoveryDigestIfAvailable()
        async let recoveryHealth = underlying.getOperatorRecoveryHealthIfAvailable()

        let dailyResult = await daily
        let queueResult = await queue
        let slotsResult = await slots
        let digestRes = await digest
        let recoveryRes = await recoveryHealth

        let dailyRes = try? dailyResult.get()
        let queueRes = try? queueResult.get()
        let slotsRes = try? slotsResult.get()

        if dailyRes == nil, queueRes == nil, slotsRes == nil {
            // Every required section failed — surface the first real error
            // rather than a payload that's silently empty across the board.
            func failure<T>(_ result: Result<T, LabeledAPIFailure>) -> LabeledAPIFailure? {
                if case let .failure(error) = result { return error }
                return nil
            }
            let firstFailure = failure(dailyResult) ?? failure(queueResult) ?? failure(slotsResult)
            throw firstFailure ?? LabeledAPIFailure(
                endpoint: "GET /v1/businesses/mine/daily-ops-summary",
                underlying: URLError(.unknown)
            )
        }

        return BusinessTodayDashboardPayload(
            daily: dailyRes,
            queue: queueRes,
            openSlots: slotsRes ?? [],
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

    /// Same as `labeled`, but captures the failure instead of throwing —
    /// for bundle fetches where sections must be able to fail independently.
    private func labeledResult<T: Sendable>(
        _ endpoint: String,
        _ work: @Sendable () async throws -> T
    ) async -> Result<T, LabeledAPIFailure> {
        do {
            return .success(try await labeled(endpoint, work))
        } catch let failure as LabeledAPIFailure {
            return .failure(failure)
        } catch {
            return .failure(LabeledAPIFailure(endpoint: endpoint, underlying: error))
        }
    }

    // MARK: - Openings / slot actions (used beyond Today; keeps operator naming in one place)

    func listMyOpenSlots() async throws -> OpenSlotsListAPIResponse {
        let rows = try await underlying.getAllStaffOpenSlots()
        return OpenSlotsListAPIResponse(openSlots: rows)
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
    /// Optional: this section's own fetch can fail independently without blanking the tab.
    let daily: OperatorDailyOpsSummaryResponse?
    /// Optional: this section's own fetch can fail independently without blanking the tab.
    let queue: OperatorActionQueueResponse?
    let openSlots: [StaffOpenSlotListRow]
    let morningDigest: MorningRecoveryDigestResponse?
    let recoveryHealth: OperatorRecoveryHealthResponse?
}
