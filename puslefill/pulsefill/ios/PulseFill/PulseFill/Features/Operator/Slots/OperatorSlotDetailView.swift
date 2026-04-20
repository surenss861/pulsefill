import SwiftUI

struct OperatorSlotDetailView: View {
    @StateObject private var viewModel: OperatorSlotDetailViewModel
    @State private var showFlash = false

    init(api: APIClient, slotId: String) {
        _viewModel = StateObject(wrappedValue: OperatorSlotDetailViewModel(api: api, slotId: slotId))
    }

    var body: some View {
        Group {
            if viewModel.slot == nil, viewModel.loadState == .loading || viewModel.loadState == .idle {
                loadingView
            } else if viewModel.slot == nil, case let .failed(msg) = viewModel.loadState {
                errorView(msg)
            } else if let slot = viewModel.slot {
                slotContent(slot)
            } else {
                loadingView
            }
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Slot")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.surface1, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .onChange(of: viewModel.flashMessage) { _, new in
            showFlash = new != nil
        }
        .alert("Update", isPresented: $showFlash) {
            Button("OK", role: .cancel) {
                viewModel.flashMessage = nil
            }
        } message: {
            Text(viewModel.flashMessage ?? "")
        }
    }

    private var loadingView: some View {
        VStack {
            Spacer()
            ProgressView().tint(PFColor.primary)
            Spacer()
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 12) {
            Spacer()
            Text("Couldn’t load slot")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(message)
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Button("Retry") {
                Task { await viewModel.load() }
            }
            .buttonStyle(PFPrimaryButtonStyle())
            Spacer()
        }
    }

    private func slotContent(_ slot: StaffOpenSlotDetail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                recentActivityBar(slot)
                nextActionCard(slot)
                heroCard(slot)

                OperatorInternalNoteCard(
                    initialNote: slot.internalNote,
                    initialResolution: slot.resolutionStatus,
                    initialUpdatedAt: slot.internalNoteUpdatedAt,
                    isSaving: viewModel.isSavingNote,
                    onSave: { note, status in
                        Task { await viewModel.saveInternalNote(note: note, resolutionStatus: status) }
                    }
                )

                if !viewModel.notificationLogs.isEmpty {
                    OperatorSlotDeliverySummaryCard(logs: viewModel.notificationLogs)
                }

                if let ctx = viewModel.customerContext {
                    OperatorCustomerSummaryCard(customer: ctx.customer, delivery: ctx.deliveryContext)
                    OperatorStandbyPreferencesSection(preferences: ctx.standbyPreferences)
                }

                if viewModel.hasAttentionCues {
                    attentionCard(slot)
                }

                if let claim = slot.winningClaim {
                    winningClaimCard(claim, context: viewModel.customerContext)
                }

                offerOutcomesCard(slot.slotOffers ?? [])
                timelineCard(viewModel.timeline)
            }
            .padding(20)
            .padding(.bottom, 28)
        }
    }

    private func recentActivityBar(_ slot: StaffOpenSlotDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if let latest = OperatorSlotDetailPresenters.latestMilestone(viewModel.timeline) {
                Text("Latest activity: \(latest)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
            if let touch = OperatorSlotDetailPresenters.lastTouchedSummary(for: slot) {
                Text(touch)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
            if slot.status == "claimed" {
                Text("Awaiting staff confirmation")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.warning)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFColor.primary.opacity(0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(PFColor.primary.opacity(0.14), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func nextActionCard(_ slot: StaffOpenSlotDetail) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(OperatorSlotDetailPresenters.nextActionTitle(for: slot.status).uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.primary)

            Text(OperatorSlotDetailPresenters.nextActionDescription(for: slot.status))
                .font(.system(size: 17))
                .foregroundStyle(PFColor.textPrimary)

            HStack(spacing: 10) {
                if slot.status == "claimed" {
                    Button(viewModel.isConfirming ? "Confirming…" : "Confirm booking") {
                        Task { await viewModel.confirmBooking() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primaryDark)
                    .disabled(viewModel.isConfirming)
                } else if slot.status == "open" || slot.status == "offered" {
                    Button(viewModel.isRetrying ? "Sending…" : (slot.status == "open" ? "Send offers" : "Retry offers")) {
                        Task { await viewModel.retryOffers() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primaryDark)
                    .disabled(viewModel.isRetrying)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.primary.opacity(0.16), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func heroCard(_ slot: StaffOpenSlotDetail) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("OPENING FOR")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text(slot.providerNameSnapshot ?? "Provider")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            Text(DateFormatterPF.dateTimeRange(start: slot.startsAt, end: slot.endsAt))
                .font(.system(size: 17))
                .foregroundStyle(PFColor.textSecondary)

            StatusChipView(status: slot.status)

            VStack(alignment: .leading, spacing: 10) {
                metricRow("Service", slot.serviceId.map(shortId) ?? "—")
                metricRow("Location", slot.locationId.map(shortId) ?? "—")
                metricRow("Est. value", slot.estimatedValueCents.map { CurrencyFormatter.currency(cents: $0) } ?? "—")
                metricRow("Offers", "\((slot.slotOffers ?? []).count)")
                metricRow("Notes", (slot.notes?.isEmpty == false) ? (slot.notes ?? "") : "—")
            }
        }
        .padding(18)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func metricRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
                .frame(width: 88, alignment: .leading)
            Text(value)
                .font(.system(size: 17))
                .foregroundStyle(PFColor.textPrimary)
            Spacer(minLength: 0)
        }
    }

    private func attentionCard(_ slot: StaffOpenSlotDetail) -> some View {
        let failedOffers = (slot.slotOffers ?? []).filter { $0.status == "failed" }.count
        let failedLogs = viewModel.notificationLogs.filter { $0.status == "failed" }.count

        return Group {
            if failedOffers > 0 || failedLogs > 0 {
                VStack(alignment: .leading, spacing: 10) {
                    Text("NEEDS ATTENTION")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(PFColor.warning)

                    if failedOffers > 0 {
                        Text("\(failedOffers) offer deliveries failed.")
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textPrimary)
                    }
                    if failedLogs > 0 {
                        Text("\(failedLogs) notification attempts failed.")
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textPrimary)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(PFColor.warning.opacity(0.10))
                .overlay(
                    RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                        .stroke(PFColor.warning.opacity(0.18), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
            }
        }
    }

    private func winningClaimCard(_ claim: WinningClaimRow, context: OperatorCustomerContextResponse?) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("WINNING CLAIM")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.warning)

            if let name = context?.customer.displayName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
                Text(name)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Text("Ref \(shortId(claim.customerId))")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            } else {
                Text(shortId(claim.customerId))
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
            }

            StatusChipView(status: claim.status)
        }
        .padding(16)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func offerOutcomesCard(_ offers: [StaffSlotOfferRow]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("OFFER OUTCOMES")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text(OperatorSlotDetailPresenters.offerOutcomeSummary(offers))
                .font(.system(size: 17))
                .foregroundStyle(PFColor.textPrimary)

            if offers.isEmpty {
                Text("No offers have been sent for this slot yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(16)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func timelineCard(_ events: [OperatorTimelineEvent]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("RECENT ACTIVITY")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if events.isEmpty {
                Text("No timeline events yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            } else {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(Array(events.prefix(8))) { event in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(OperatorSlotDetailPresenters.timelineEventTitle(for: event.eventType))
                                .font(.system(size: 17, weight: .medium))
                                .foregroundStyle(PFColor.textPrimary)
                            Text(DateFormatterPF.medium(event.createdAt))
                                .font(.system(size: 13))
                                .foregroundStyle(PFColor.textSecondary)
                            if let actor = OperatorSlotDetailPresenters.timelineActorLine(for: event) {
                                Text(actor)
                                    .font(.system(size: 12))
                                    .foregroundStyle(PFColor.textSecondary)
                            }
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func shortId(_ id: String) -> String {
        if id.count <= 14 { return id }
        return "\(id.prefix(4))…\(id.suffix(4))"
    }
}
