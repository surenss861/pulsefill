import Combine
import Foundation

struct StandbyResolvedLabels: Equatable {
    var businessName: String?
    var serviceName: String?
}

@MainActor
final class StandbyPreferencesViewModel: ObservableObject {
    enum SaveState: Equatable {
        case idle
        case saving
        case saved
        case failed(String)
    }

    @Published var draft = StandbyPreferenceDraft()
    @Published var saveState: SaveState = .idle

    /// When set, saves use `PATCH` for this preference id instead of creating a new row.
    @Published private(set) var editingPreferenceId: String?

    @Published var existingPreferences: [StandbyPreference] = []
    @Published var loadingExisting = false
    @Published var loadError: String?

    @Published private(set) var draftResolvedLabels = StandbyResolvedLabels()
    @Published private(set) var savedResolvedLabels: [String: StandbyResolvedLabels] = [:]

    @Published private(set) var businessServices: [BusinessServiceRow] = []
    @Published var loadingBusinessServices = false
    @Published var businessServicesError: String?

    @Published var actionError: String?

    /// When set, the business UUID field is fixed (directory / deep link) and shown as a clinic name.
    var businessSelectionLocked: Bool = false
    var lockedBusinessDisplayName: String?

    private let api: APIClient
    /// Tracks the last business ID we loaded services for; used to clear `serviceId` when the business changes.
    private var lastServicesBusinessId: String?
    /// `active` flag on the row being edited (not editable in the form; preserved on save).
    private var editingActiveSnapshot: Bool = true

    init(
        api: APIClient,
        initialBusinessId: String? = nil,
        initialBusinessDisplayName: String? = nil,
        initialServiceId: String? = nil,
        lockBusinessSelection: Bool = false
    ) {
        self.api = api
        if let bid = initialBusinessId?.trimmingCharacters(in: .whitespacesAndNewlines), !bid.isEmpty {
            draft.businessId = bid
        }
        if let sid = initialServiceId?.trimmingCharacters(in: .whitespacesAndNewlines), !sid.isEmpty {
            draft.serviceId = sid
        }
        businessSelectionLocked = lockBusinessSelection && draft.isBusinessIdValid
        let trimmedName = initialBusinessDisplayName?.trimmingCharacters(in: .whitespacesAndNewlines)
        lockedBusinessDisplayName = (trimmedName?.isEmpty == false) ? trimmedName : nil
        if businessSelectionLocked {
            lastServicesBusinessId = draft.trimmedBusinessId
        }
    }

    var isEditingExistingPreference: Bool {
        editingPreferenceId != nil
    }

    func beginEditing(_ preference: StandbyPreference) {
        businessSelectionLocked = false
        lockedBusinessDisplayName = nil
        editingPreferenceId = preference.id
        editingActiveSnapshot = preference.active
        lastServicesBusinessId = preference.businessId
        draft = StandbyPreferenceDraft(from: preference)
        saveState = .idle
        actionError = nil
        Task { await handleBusinessIdentifierChange() }
    }

    func cancelEditing() {
        let bid = draft.trimmedBusinessId
        editingPreferenceId = nil
        editingActiveSnapshot = true
        saveState = .idle
        draft = StandbyPreferenceDraft()
        if UUID(uuidString: bid) != nil {
            draft.businessId = bid
        }
        lastServicesBusinessId = draft.isBusinessIdValid ? draft.trimmedBusinessId : nil
        Task { await handleBusinessIdentifierChange() }
    }

    /// Call when the business UUID field changes or after hydrating draft from storage.
    func handleBusinessIdentifierChange() async {
        let bid = draft.trimmedBusinessId
        guard draft.isBusinessIdValid else {
            lastServicesBusinessId = nil
            businessServices = []
            businessServicesError = nil
            draftResolvedLabels = StandbyResolvedLabels()
            return
        }
        if let prev = lastServicesBusinessId, prev != bid {
            draft.serviceId = ""
        }
        lastServicesBusinessId = bid

        loadingBusinessServices = true
        businessServicesError = nil
        defer { loadingBusinessServices = false }

        do {
            businessServices = try await api.getCustomerBusinessServices(businessId: bid)
        } catch {
            businessServices = []
            businessServicesError = APIErrorCopy.message(for: error)
        }

        await refreshDraftLabels()
    }

    func servicePickerOptions() -> [ServiceOption] {
        var rows: [ServiceOption] = [
            ServiceOption(
                id: "any",
                name: "Any service",
                description: "Open to earlier openings for any visit type at this clinic."
            ),
        ]
        for s in businessServices {
            rows.append(
                ServiceOption(
                    id: s.id,
                    name: s.name,
                    description: Self.serviceSubtitle(s)
                )
            )
        }
        let trimmed = draft.serviceId.trimmingCharacters(in: .whitespacesAndNewlines)
        if UUID(uuidString: trimmed) != nil,
           !trimmed.isEmpty,
           !businessServices.contains(where: { $0.id == trimmed })
        {
            rows.append(
                ServiceOption(
                    id: trimmed,
                    name: "Other service",
                    description: "Not in the current list — we’ll keep this selection."
                )
            )
        }
        return rows
    }

    private static func serviceSubtitle(_ s: BusinessServiceRow) -> String? {
        var parts: [String] = []
        if let m = s.durationMinutes {
            parts.append("\(m) min")
        }
        if let cents = s.priceCents {
            let price = String(format: "$%.2f", Double(cents) / 100.0)
            parts.append(price)
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    func loadExistingPreferences() async {
        loadingExisting = true
        loadError = nil
        defer { loadingExisting = false }

        do {
            let rows = try await api.get("/v1/customers/me/preferences", as: [StandbyPreference].self)
            existingPreferences = rows
            await refreshSavedLabels()
        } catch {
            loadError = APIErrorCopy.message(for: error)
        }
    }

    func refreshDraftLabels() async {
        guard draft.isBusinessIdValid else {
            draftResolvedLabels = StandbyResolvedLabels()
            return
        }
        let bid = draft.trimmedBusinessId
        let sid = emptyToNil(draft.serviceId)
        do {
            let r = try await api.getStandbyLabels(businessId: bid, serviceId: sid)
            draftResolvedLabels = StandbyResolvedLabels(businessName: r.businessName, serviceName: r.serviceName)
        } catch {
            draftResolvedLabels = StandbyResolvedLabels()
        }
    }

    private func refreshSavedLabels() async {
        var next: [String: StandbyResolvedLabels] = [:]
        for p in existingPreferences {
            do {
                let r = try await api.getStandbyLabels(businessId: p.businessId, serviceId: p.serviceId)
                next[p.id] = StandbyResolvedLabels(businessName: r.businessName, serviceName: r.serviceName)
            } catch {
                next[p.id] = StandbyResolvedLabels()
            }
        }
        savedResolvedLabels = next
    }

    @discardableResult
    func savePreference() async -> Bool {
        guard draft.canReview else {
            let msg: String
            if draft.isBasicSetupComplete, draft.hasAvailabilityWindow, !draft.isTimeWindowValid {
                msg = "Set your latest time after your earliest time."
            } else {
                msg = "Add your clinic’s business ID, pick at least one day, and fix any time window issues."
            }
            saveState = .failed(msg)
            return false
        }

        saveState = .saving
        actionError = nil

        do {
            if let editId = editingPreferenceId {
                let body = UpdateStandbyPreferenceBody(
                    locationId: emptyToNil(draft.locationId),
                    serviceId: emptyToNil(draft.serviceId),
                    providerId: emptyToNil(draft.providerId),
                    maxNoticeHours: draft.maxNoticeHours,
                    earliestTime: StandbyTimeEncoding.hm(draft.earliestTime),
                    latestTime: StandbyTimeEncoding.hm(draft.latestTime),
                    daysOfWeek: Array(draft.daysOfWeek).sorted(),
                    maxDistanceKm: draft.maxDistanceKm,
                    depositOk: draft.depositOk,
                    active: editingActiveSnapshot
                )
                _ = try await api.patch(
                    "/v1/customers/me/preferences/\(editId)",
                    body: body,
                    as: StandbyPreference.self
                )
                editingPreferenceId = nil
                editingActiveSnapshot = true
            } else {
                let body = CreateStandbyPreferenceBody(
                    businessId: draft.trimmedBusinessId,
                    locationId: emptyToNil(draft.locationId),
                    serviceId: emptyToNil(draft.serviceId),
                    providerId: emptyToNil(draft.providerId),
                    maxNoticeHours: draft.maxNoticeHours,
                    earliestTime: StandbyTimeEncoding.hm(draft.earliestTime),
                    latestTime: StandbyTimeEncoding.hm(draft.latestTime),
                    daysOfWeek: Array(draft.daysOfWeek).sorted(),
                    maxDistanceKm: draft.maxDistanceKm,
                    depositOk: draft.depositOk,
                    active: true
                )
                _ = try await api.post("/v1/customers/me/preferences", body: body, as: StandbyPreference.self)
            }
            saveState = .saved
            await loadExistingPreferences()
            return true
        } catch {
            saveState = .failed(APIErrorCopy.message(for: error))
            return false
        }
    }

    func resetDraftAfterSuccess(keepingBusinessId: Bool) {
        let bid = draft.trimmedBusinessId
        editingPreferenceId = nil
        editingActiveSnapshot = true
        draft = StandbyPreferenceDraft()
        if keepingBusinessId {
            draft.businessId = bid
        }
        saveState = .idle
        if keepingBusinessId, draft.isBusinessIdValid {
            lastServicesBusinessId = draft.trimmedBusinessId
        } else {
            lastServicesBusinessId = nil
        }
        Task { await refreshDraftLabels() }
    }

    func setActive(_ preferenceId: String, active: Bool) async {
        actionError = nil
        let body = PatchStandbyPreferenceBody(active: active)
        do {
            let updated = try await api.patch(
                "/v1/customers/me/preferences/\(preferenceId)",
                body: body,
                as: StandbyPreference.self
            )
            if let idx = existingPreferences.firstIndex(where: { $0.id == preferenceId }) {
                existingPreferences[idx] = updated
            }
            if editingPreferenceId == preferenceId {
                editingActiveSnapshot = active
            }
        } catch {
            actionError = APIErrorCopy.message(for: error)
        }
    }

    func deletePreference(_ preferenceId: String) async {
        actionError = nil
        do {
            try await api.delete("/v1/customers/me/preferences/\(preferenceId)")
            existingPreferences.removeAll { $0.id == preferenceId }
            savedResolvedLabels[preferenceId] = nil
            if editingPreferenceId == preferenceId {
                cancelEditing()
            }
        } catch {
            actionError = APIErrorCopy.message(for: error)
        }
    }

    private func emptyToNil(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}

private struct CreateStandbyPreferenceBody: Encodable {
    let businessId: String
    let locationId: String?
    let serviceId: String?
    let providerId: String?
    let maxNoticeHours: Int?
    let earliestTime: String?
    let latestTime: String?
    let daysOfWeek: [Int]
    let maxDistanceKm: Int?
    let depositOk: Bool
    let active: Bool
}

private struct PatchStandbyPreferenceBody: Encodable {
    var active: Bool?
}

private struct UpdateStandbyPreferenceBody: Encodable {
    let locationId: String?
    let serviceId: String?
    let providerId: String?
    let maxNoticeHours: Int?
    let earliestTime: String?
    let latestTime: String?
    let daysOfWeek: [Int]
    let maxDistanceKm: Int?
    let depositOk: Bool
    let active: Bool
}
