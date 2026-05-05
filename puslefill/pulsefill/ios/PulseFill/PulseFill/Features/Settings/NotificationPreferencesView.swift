import SwiftUI

struct NotificationPreferencesView: View {
    @State private var viewModel: NotificationPreferencesViewModel

    init(api: APIClient) {
        _viewModel = State(initialValue: NotificationPreferencesViewModel(api: api))
    }

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                ZStack {
                    PFScreenBackground()
                    PFCustomerLoadingState(
                        title: "Loading notification settings…",
                        message: "Getting how you want to hear about openings and updates.",
                        compact: false
                    )
                }

            case let .failed(message):
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        PFCustomerErrorState(
                            title: "We couldn’t load notification settings",
                            message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(message),
                            primaryTitle: "Try again",
                            primaryAction: { Task { await viewModel.load() } },
                            secondaryTitle: nil,
                            secondaryAction: nil
                        )
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                }
                .background(PFScreenBackground())

            case .loaded:
                content
            }
        }
        .background(PFScreenBackground())
        .navigationTitle("Notification settings")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .alert(
            "Update",
            isPresented: Binding(
                get: { viewModel.flashMessage != nil },
                set: { if !$0 { viewModel.flashMessage = nil } }
            ),
            actions: {
                Button("OK", role: .cancel) {}
            },
            message: {
                Text(sanitizedFlash)
            }
        )
    }

    private var sanitizedFlash: String {
        guard let m = viewModel.flashMessage else { return "" }
        return PFCustomerFacingErrorCopy.sanitizeCustomerMessage(m)
    }

    @ViewBuilder
    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                PFCustomerInfoCallout(
                    title: "Why notifications matter",
                    message:
                        "Openings can move quickly. Alerts help you see a match in time. You stay in control of style, quiet hours, and what kinds of updates you receive.",
                    variant: .neutral
                )

                NotificationReadinessStatusCard(readiness: viewModel.response?.readiness)

                PFCustomerSectionCard(variant: .default, padding: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        PFTypography.Customer.label("Quiet hours")
                        Toggle("Pause non-urgent alerts overnight", isOn: $viewModel.quietHoursEnabled)
                            .tint(PFColor.ember)

                        if viewModel.quietHoursEnabled {
                            Text("Starts: \(viewModel.quietHoursStartLocal)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(PFColor.textSecondary)
                            Text("Ends: \(viewModel.quietHoursEndLocal)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(PFColor.textSecondary)
                        }
                    }
                }

                PFCustomerSectionCard(variant: .default, padding: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        PFTypography.Customer.label("How often we reach out")
                        Picker("Notification style", selection: $viewModel.cadencePreference) {
                            Text("All matching openings").tag("all_opportunities")
                            Text("Only the best matches").tag("best_matches")
                            Text("Important updates only").tag("important_only")
                        }
                        .pickerStyle(.menu)
                        .tint(PFColor.ember)
                    }
                }

                PFCustomerSectionCard(variant: .default, padding: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        PFTypography.Customer.label("What you want to hear about")
                        Toggle("New openings", isOn: $viewModel.notifyNewOffers)
                        Toggle("Waiting for confirmation", isOn: $viewModel.notifyClaimUpdates)
                        Toggle("Confirmed bookings", isOn: $viewModel.notifyBookingConfirmations)
                        Toggle("Standby tips", isOn: $viewModel.notifyStandbyTips)
                    }
                }

                PFCustomerInfoCallout(
                    title: "A note on urgency",
                    message:
                        "Time-sensitive openings try to reach you quickly. Quiet hours mainly affect reminders and softer tips — not the only way the business may contact you.",
                    variant: .neutral
                )

                PFCustomerPrimaryButton(
                    title: viewModel.isSaving ? "Saving…" : "Save settings",
                    isEnabled: !viewModel.isSaving,
                    isLoading: viewModel.isSaving,
                    hapticImpact: .medium,
                    onDisabledTap: nil,
                    action: { Task { await viewModel.save() } }
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
    }
}
