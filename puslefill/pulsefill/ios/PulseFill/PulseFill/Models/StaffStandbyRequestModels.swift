import Foundation

// MARK: - GET /v1/businesses/mine/standby-requests

struct StaffStandbyRequestsListResponse: Codable {
    let requests: [StaffStandbyRequestRow]
}

struct StaffStandbyRequestRow: Codable, Identifiable {
    let id: String
    let customerId: String
    let status: String
    let message: String?
    let requestedAt: String
    let reviewedAt: String?
    let reviewedByStaffId: String?
    let businessId: String?
    let createdAt: String?
    let customerName: String?
    let customerEmail: String?
    let customerLabel: String?
}

// MARK: - POST approve / decline

struct StaffStandbyRequestReviewResponse: Codable {
    let request: StaffStandbyRequestReviewRow
}

struct StaffStandbyRequestReviewRow: Codable {
    let id: String
    let status: String
    let customerId: String?
}
