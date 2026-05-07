import Foundation

private struct OperatorEmptyInvitePOST: Encodable {}

extension APIClient {
    func listStaffCustomerInvites() async throws -> StaffCustomerInvitesListResponse {
        try await get("/v1/businesses/mine/customer-invites", as: StaffCustomerInvitesListResponse.self)
    }

    func createStaffCustomerInvite(body: CreateStaffCustomerInviteBody) async throws -> StaffCustomerInviteListItemDTO {
        try await post(
            "/v1/businesses/mine/customer-invites",
            body: body,
            as: StaffCustomerInviteListItemDTO.self
        )
    }

    func revokeStaffCustomerInvite(inviteId: String) async throws -> StaffCustomerInviteListItemDTO {
        let res = try await post(
            "/v1/businesses/mine/customer-invites/\(inviteId)/revoke",
            body: OperatorEmptyInvitePOST(),
            as: RevokeStaffCustomerInviteResponseDTO.self
        )
        return res.invite
    }
}
