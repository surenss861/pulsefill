import Foundation

struct StandbyLabelsResponse: Decodable {
    let businessName: String
    let serviceName: String?
}

extension APIClient {
    func getCustomerBusinessServices(businessId: String) async throws -> [BusinessServiceRow] {
        try await get(
            "/v1/customers/me/business-services?business_id=\(businessId)",
            as: [BusinessServiceRow].self
        )
    }

    func getStandbyLabels(businessId: String, serviceId: String?) async throws -> StandbyLabelsResponse {
        var path = "/v1/customers/me/standby-labels?business_id=\(businessId)"
        if let sid = serviceId?.trimmingCharacters(in: .whitespacesAndNewlines),
           !sid.isEmpty,
           UUID(uuidString: sid) != nil
        {
            path += "&service_id=\(sid)"
        }
        return try await get(path, as: StandbyLabelsResponse.self)
    }
}
