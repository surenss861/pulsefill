import Foundation

extension APIClient {
    func getOfferDetail(offerId: String) async throws -> CustomerOfferDetailResponse {
        try await get("/v1/customers/me/offers/\(offerId)", as: CustomerOfferDetailResponse.self)
    }

    func getClaimOutcome(claimId: String) async throws -> ClaimOutcomeResponse {
        try await get("/v1/customers/me/claims/\(claimId)/status", as: ClaimOutcomeResponse.self)
    }

    func getCustomerActivityFeed(pushPermissionStatus: String) async throws -> CustomerActivityFeedResponse {
        let enc = pushPermissionStatus.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "unknown"
        return try await get(
            "/v1/customers/me/activity-feed?push_permission_status=\(enc)",
            as: CustomerActivityFeedResponse.self
        )
    }

    func getMissedOpportunities() async throws -> MissedOpportunitiesResponse {
        try await get("/v1/customers/me/missed-opportunities", as: MissedOpportunitiesResponse.self)
    }

    func getNotificationPreferences(pushPermissionStatus: String) async throws -> NotificationPreferencesResponse {
        let enc = pushPermissionStatus.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "unknown"
        return try await get(
            "/v1/customers/me/notification-preferences?push_permission_status=\(enc)",
            as: NotificationPreferencesResponse.self
        )
    }

    func updateNotificationPreferences(
        pushPermissionStatus: String,
        body: UpdateNotificationPreferencesBody
    ) async throws -> NotificationPreferencesResponse {
        let enc = pushPermissionStatus.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "unknown"
        return try await patch(
            "/v1/customers/me/notification-preferences?push_permission_status=\(enc)",
            body: body,
            as: NotificationPreferencesResponse.self
        )
    }
}
