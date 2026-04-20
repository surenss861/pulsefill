import Foundation

struct OperatorCustomerContextResponse: Codable {
    let customer: OperatorCustomerContextCustomer
    let standbyPreferences: [OperatorStandbyPreferenceItem]
    let deliveryContext: OperatorDeliveryContext

    enum CodingKeys: String, CodingKey {
        case customer
        case standbyPreferences = "standby_preferences"
        case deliveryContext = "delivery_context"
    }
}

struct OperatorCustomerContextCustomer: Codable {
    let id: String
    let displayName: String?
    let emailMasked: String?
    let phoneMasked: String?
    let pushEnabled: Bool
    let smsEnabled: Bool
    let emailEnabled: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case emailMasked = "email_masked"
        case phoneMasked = "phone_masked"
        case pushEnabled = "push_enabled"
        case smsEnabled = "sms_enabled"
        case emailEnabled = "email_enabled"
    }
}

struct OperatorStandbyPreferenceItem: Codable, Identifiable {
    let id: String
    let active: Bool
    let businessName: String?
    let serviceName: String?
    let locationName: String?
    let providerName: String?
    let daysOfWeek: [Int]
    let earliestTime: String?
    let latestTime: String?
    let maxNoticeHours: Int?
    let depositOk: Bool

    enum CodingKeys: String, CodingKey {
        case id, active
        case businessName = "business_name"
        case serviceName = "service_name"
        case locationName = "location_name"
        case providerName = "provider_name"
        case daysOfWeek = "days_of_week"
        case earliestTime = "earliest_time"
        case latestTime = "latest_time"
        case maxNoticeHours = "max_notice_hours"
        case depositOk = "deposit_ok"
    }
}

struct OperatorDeliveryContext: Codable {
    let pushDevicesCount: Int
    let hasPushReady: Bool
    let hasEmail: Bool
    let hasSms: Bool
    let hasAnyReachableChannel: Bool
    let lastFailedDeliveryAt: String?
    let lastFailedDeliveryReason: String?

    enum CodingKeys: String, CodingKey {
        case pushDevicesCount = "push_devices_count"
        case hasPushReady = "has_push_ready"
        case hasEmail = "has_email"
        case hasSms = "has_sms"
        case hasAnyReachableChannel = "has_any_reachable_channel"
        case lastFailedDeliveryAt = "last_failed_delivery_at"
        case lastFailedDeliveryReason = "last_failed_delivery_reason"
    }
}
