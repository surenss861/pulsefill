import Combine
import Foundation

@MainActor
final class OperatorCreateOpeningViewModel: ObservableObject {
    @Published var loadState: OperatorSlotsListViewModel.LoadState = .idle
    @Published var serviceOptions: [BusinessNamedRow] = []
    @Published var providerOptions: [BusinessNamedRow] = []
    @Published var locationOptions: [BusinessNamedRow] = []

    @Published var selectedServiceId: String?
    @Published var selectedProviderId: String?
    @Published var selectedLocationId: String?

    @Published var appointmentDate: Date = Date()
    @Published var startTime: Date = Date()
    @Published var selectedDurationMinutes: Int = 60
    @Published var useCustomEnd: Bool = false
    @Published var customEndTime: Date = Date().addingTimeInterval(3600)

    @Published var estimatedValueDollarsText: String = ""
    @Published var internalNote: String = ""

    @Published var validationMessage: String?
    @Published var banner: String?
    @Published var isSubmitting = false

    /// When set, the view should push slot detail for this id.
    @Published var navigateToCreatedSlotId: String?

    private let businessAPI: BusinessOperatorAPIClient

    init(businessAPI: BusinessOperatorAPIClient) {
        self.businessAPI = businessAPI
    }

    func loadReferenceData() async {
        loadState = .loading
        validationMessage = nil
        do {
            async let s = businessAPI.namedServices()
            async let p = businessAPI.namedProviders()
            async let l = businessAPI.namedLocations()
            let (sv, pv, lv) = try await (s, p, l)
            serviceOptions = sv
            providerOptions = pv
            locationOptions = lv
            applySingleOptionDefaults()
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    private func applySingleOptionDefaults() {
        if selectedServiceId == nil, serviceOptions.count == 1 {
            selectedServiceId = serviceOptions[0].id
        }
        if selectedProviderId == nil, providerOptions.count == 1 {
            selectedProviderId = providerOptions[0].id
        }
        if selectedLocationId == nil, locationOptions.count == 1 {
            selectedLocationId = locationOptions[0].id
        }
    }

    func applyDurationPreset(_ minutes: Int) {
        selectedDurationMinutes = minutes
        useCustomEnd = false
    }

    private var combinedStart: Date {
        let cal = Calendar.current
        let dayStart = cal.startOfDay(for: appointmentDate)
        let t = cal.dateComponents([.hour, .minute], from: startTime)
        return cal.date(bySettingHour: t.hour ?? 9, minute: t.minute ?? 0, second: 0, of: dayStart) ?? appointmentDate
    }

    private var combinedEnd: Date {
        if useCustomEnd {
            let cal = Calendar.current
            let dayStart = cal.startOfDay(for: appointmentDate)
            let t = cal.dateComponents([.hour, .minute], from: customEndTime)
            return cal.date(bySettingHour: t.hour ?? 10, minute: t.minute ?? 0, second: 0, of: dayStart) ?? combinedStart.addingTimeInterval(3600)
        }
        return combinedStart.addingTimeInterval(TimeInterval(selectedDurationMinutes * 60))
    }

    private var providerNameSnapshot: String? {
        guard let id = selectedProviderId else { return nil }
        return providerOptions.first(where: { $0.id == id })?.name
    }

    private func parsedEstimatedCents() -> Int? {
        let trimmed = estimatedValueDollarsText.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return nil }
        guard let dollars = Double(trimmed.replacingOccurrences(of: ",", with: "")) else { return nil }
        if dollars < 0 { return nil }
        return Int((dollars * 100.0).rounded())
    }

    func validateForSubmit() -> Bool {
        validationMessage = nil
        if selectedServiceId == nil || selectedServiceId?.isEmpty == true {
            validationMessage = "Choose a service for this opening."
            return false
        }
        let start = combinedStart
        let end = combinedEnd
        if end <= start {
            validationMessage = "End time must be after start time."
            return false
        }
        if let cents = parsedEstimatedCents(), cents < 0 {
            validationMessage = "Estimated value can’t be negative."
            return false
        }
        return true
    }

    func submit() async {
        guard validateForSubmit() else { return }
        guard !isSubmitting else { return }
        isSubmitting = true
        banner = nil
        defer { isSubmitting = false }

        let noteTrim = internalNote.trimmingCharacters(in: .whitespacesAndNewlines)
        let body = CreateOpenSlotRequestBody(
            serviceId: selectedServiceId,
            providerId: selectedProviderId,
            locationId: selectedLocationId,
            providerNameSnapshot: providerNameSnapshot,
            startsAt: DateFormatterPF.openSlotAPIInstant(from: combinedStart),
            endsAt: DateFormatterPF.openSlotAPIInstant(from: combinedEnd),
            estimatedValueCents: parsedEstimatedCents(),
            notes: nil,
            internalNote: noteTrim.isEmpty ? nil : noteTrim
        )

        do {
            let res = try await businessAPI.createOpenSlot(body)
            guard let id = res.createdSlotId, !id.isEmpty else {
                banner = "Opening created, but the app didn’t get an ID back. Check Openings."
                return
            }
            OperatorMutationNotifier.postSlotUpdated(slotId: id, action: .createSlot)
            PFHaptics.success()
            navigateToCreatedSlotId = id
        } catch {
            banner = OperatorMutationFriendlyCopy.createOpeningFailed(error)
        }
    }

    func consumeNavigationSlotId() {
        navigateToCreatedSlotId = nil
    }
}
