import Foundation

private struct EmptyJSONObject: Encodable {}

extension APIClient {
    func listStaffStandbyRequests(status: String = "pending") async throws -> StaffStandbyRequestsListResponse {
        let enc = status.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "pending"
        return try await get(
            "/v1/businesses/mine/standby-requests?status=\(enc)",
            as: StaffStandbyRequestsListResponse.self
        )
    }

    func approveStaffStandbyRequest(requestId: String) async throws -> StaffStandbyRequestReviewResponse {
        try await post(
            "/v1/businesses/mine/standby-requests/\(requestId)/approve",
            body: EmptyJSONObject(),
            as: StaffStandbyRequestReviewResponse.self
        )
    }

    func declineStaffStandbyRequest(requestId: String) async throws -> StaffStandbyRequestReviewResponse {
        try await post(
            "/v1/businesses/mine/standby-requests/\(requestId)/decline",
            body: EmptyJSONObject(),
            as: StaffStandbyRequestReviewResponse.self
        )
    }
}
