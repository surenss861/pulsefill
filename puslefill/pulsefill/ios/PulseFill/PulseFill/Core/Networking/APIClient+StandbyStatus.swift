import Foundation

extension APIClient {
    func getStandbyStatus(pushPermissionStatus: String?) async throws -> StandbyStatusResponse {
        var path = "/v1/customers/me/standby-status"
        if let pushPermissionStatus {
            let allowed = CharacterSet.urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&+="))
            let enc = pushPermissionStatus.addingPercentEncoding(withAllowedCharacters: allowed) ?? pushPermissionStatus
            path += "?push_permission_status=\(enc)"
        }
        return try await get(path, as: StandbyStatusResponse.self)
    }
}
