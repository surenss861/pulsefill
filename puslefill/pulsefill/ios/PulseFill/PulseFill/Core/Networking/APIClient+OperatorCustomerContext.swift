import Foundation

extension APIClient {
    func getOperatorCustomerContext(customerId: String) async throws -> OperatorCustomerContextResponse {
        try await get(
            "/v1/businesses/mine/customers/\(customerId)/context",
            as: OperatorCustomerContextResponse.self
        )
    }
}
