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
                VStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }

            case let .failed(message):
                VStack(spacing: 12) {
                    Spacer()
                    PFTypography.section("Couldn’t load notification settings")
                    PFTypography.caption(message)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                    Button("Retry") {
                        Task { await viewModel.load() }
                    }
                    .buttonStyle(PFPrimaryButtonStyle())
                    .padding(.horizontal, 24)
                    Spacer()
                }

            case .loaded:
                content
            }
        }
        .background(PFColor.background.ignoresSafeArea())
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
                Text(viewModel.flashMessage ?? "")
            }
        )
    }

    @ViewBuilder
    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                NotificationReadinessStatusCard(readiness: viewModel.response?.readiness)

                VStack(alignment: .leading, spacing: 12) {
                    Toggle("Quiet hours", isOn: $viewModel.quietHoursEnabled)
                        .tint(PFColor.primary)

                    if viewModel.quietHoursEnabled {
                        Text("Start: \(viewModel.quietHoursStartLocal)")
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textSecondary)
                        Text("End: \(viewModel.quietHoursEndLocal)")
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(PFSurface.card)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

                VStack(alignment: .leading, spacing: 12) {
                    Text("NOTIFICATION STYLE")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)

                    Picker("Notification style", selection: $viewModel.cadencePreference) {
                        Text("All opportunities").tag("all_opportunities")
                        Text("Only the best matches").tag("best_matches")
                        Text("Important updates only").tag("important_only")
                    }
                    .pickerStyle(.menu)
                    .tint(PFColor.primary)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(PFSurface.card)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

                VStack(alignment: .leading, spacing: 12) {
                    Text("ALERT TYPES")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)

                    Toggle("New openings", isOn: $viewModel.notifyNewOffers)
                    Toggle("Claim updates", isOn: $viewModel.notifyClaimUpdates)
                    Toggle("Booking confirmations", isOn: $viewModel.notifyBookingConfirmations)
                    Toggle("Standby tips", isOn: $viewModel.notifyStandbyTips)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(PFSurface.card)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

                Text(
                    "Urgent new-opening alerts are designed to reach you quickly. Quiet hours apply best to reminders and non-urgent tips."
                )
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)

                Button(viewModel.isSaving ? "Saving…" : "Save settings") {
                    Task { await viewModel.save() }
                }
                .buttonStyle(PFPrimaryButtonStyle())
                .disabled(viewModel.isSaving)
            }
            .padding(20)
            .padding(.bottom, 28)
        }
    }
}
