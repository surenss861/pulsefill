import Foundation

/// Local editor state for `POST /v1/customers/me/preferences` (aligned to API body).
struct StandbyPreferenceDraft: Equatable {
    /// Required by API — paste the business UUID your clinic shared (pilot / until discovery list exists).
    var businessId: String = ""

    var locationId: String = ""
    var serviceId: String = ""
    var providerId: String = ""

    /// 0 = Sunday … 6 = Saturday (matches API `days_of_week`).
    var daysOfWeek: Set<Int> = []

    var earliestTime: Date
    var latestTime: Date

    var maxNoticeHours: Int = 2
    var maxDistanceKm: Int = 25
    var depositOk: Bool = false

    /// Local UX only — channel prefs are not on `standby_preferences` in API yet; copy nudges iOS notification behavior.
    var wantsPushReminders: Bool = true

    init() {
        let cal = Calendar.current
        var e = DateComponents()
        e.hour = 9
        e.minute = 0
        var l = DateComponents()
        l.hour = 17
        l.minute = 0
        earliestTime = cal.date(from: e) ?? Date()
        latestTime = cal.date(from: l) ?? Date()
    }

    init(from preference: StandbyPreference) {
        businessId = preference.businessId
        locationId = preference.locationId ?? ""
        serviceId = preference.serviceId ?? ""
        providerId = preference.providerId ?? ""
        daysOfWeek = Set(preference.daysOfWeek)
        earliestTime = StandbyTimeEncoding.dateFromClockString(preference.earliestTime)
            ?? StandbyPreferenceDraft.defaultEarliestTime()
        latestTime = StandbyTimeEncoding.dateFromClockString(preference.latestTime)
            ?? StandbyPreferenceDraft.defaultLatestTime()
        maxNoticeHours = preference.maxNoticeHours ?? 2
        maxDistanceKm = preference.maxDistanceKm ?? 25
        depositOk = preference.depositOk
        wantsPushReminders = true
    }

    private static func defaultEarliestTime() -> Date {
        var c = DateComponents()
        c.hour = 9
        c.minute = 0
        return Calendar.current.date(from: c) ?? Date()
    }

    private static func defaultLatestTime() -> Date {
        var c = DateComponents()
        c.hour = 17
        c.minute = 0
        return Calendar.current.date(from: c) ?? Date()
    }

    var trimmedBusinessId: String {
        businessId.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var isBusinessIdValid: Bool {
        UUID(uuidString: trimmedBusinessId) != nil
    }

    var isBasicSetupComplete: Bool {
        isBusinessIdValid && !trimmedBusinessId.isEmpty
    }

    var hasAvailabilityWindow: Bool {
        !daysOfWeek.isEmpty
    }

    /// Compares clock times only (same calendar day baseline).
    var isTimeWindowValid: Bool {
        let cal = Calendar.current
        let e = cal.dateComponents([.hour, .minute], from: earliestTime)
        let l = cal.dateComponents([.hour, .minute], from: latestTime)
        let em = (e.hour ?? 0) * 60 + (e.minute ?? 0)
        let lm = (l.hour ?? 0) * 60 + (l.minute ?? 0)
        return lm > em
    }

    var canReview: Bool {
        isBasicSetupComplete && hasAvailabilityWindow && isTimeWindowValid
    }
}
