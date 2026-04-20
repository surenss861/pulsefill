import Foundation

extension APIClient {
    func getOperatorDailyOpsSummary() async throws -> OperatorDailyOpsSummaryResponse {
        try await get(
            "/v1/businesses/mine/daily-ops-summary",
            as: OperatorDailyOpsSummaryResponse.self
        )
    }
}
