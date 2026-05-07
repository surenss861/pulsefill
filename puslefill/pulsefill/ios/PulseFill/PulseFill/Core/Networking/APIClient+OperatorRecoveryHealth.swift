import Foundation

extension APIClient {
    /// Best-effort server recovery signal. Returns `nil` if the route is missing, fails, or returns a non-2xx body.
    func getOperatorRecoveryHealthIfAvailable() async -> OperatorRecoveryHealthResponse? {
        try? await get("/v1/businesses/mine/recovery-health", as: OperatorRecoveryHealthResponse.self)
    }
}
