import SwiftUI

/// Customer offer detail: pass summary, plain-language status, sticky claim CTA.
struct OfferDetailView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var viewModel: OfferDetailViewModel
    @State private var previousDetailStatus: CustomerOfferDisplayStatus?
    @State private var statusPulseTick = 0

    init(api: APIClient, offerId: String) {
        _viewModel = State(initialValue: OfferDetailViewModel(api: api, offerId: offerId))
    }

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                ZStack {
                    CustomerScreenBackground()
                    ProgressView()
                        .tint(PFColor.ember)
                }

            case let .failed(message):
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        CustomerEmptyStateCard(
                            systemImage: "exclamationmark.triangle",
                            title: "Couldn’t load this opening",
                            message: message,
                            footnote: nil
                        )
                        CustomerPrimaryButton(title: "Try again") {
                            Task { await viewModel.load() }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                }
                .background(CustomerScreenBackground())

            case .loaded:
                if let offer = viewModel.offer {
                    loadedBody(offer)
                } else {
                    CustomerScreenBackground()
                }
            }
        }
        .navigationTitle("Offer")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .tint(PFColor.ember)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .onChange(of: viewModel.displayStatus) { _, new in
            if let prev = previousDetailStatus, prev != new {
                statusPulseTick += 1
            }
            previousDetailStatus = new
        }
    }

    @ViewBuilder
    private func loadedBody(_ offer: CustomerOfferDetail) -> some View {
        let status = customerOfferDisplayStatus(forDetail: offer)

        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    PFTypography.Customer.label("Opening available")
                    PFTypography.Customer.screenLead("Review the appointment time before you claim.")
                }
                .customerAppearAnimation(staggerIndex: 0)

                CustomerAppointmentPassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Spacer()
                            CustomerStatusPill(text: status.label, tone: status.pillToneOnPass)
                                .customerStatusPillPulse(trigger: statusPulseTick)
                        }

                        Text(CustomerOfferDetailCopy.serviceLine(for: offer))
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(PFColor.passTitle)
                            .lineLimit(2)
                            .minimumScaleFactor(0.82)

                        Text(CustomerOfferDetailCopy.clinicLine(for: offer))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(PFColor.customerTextSecondary)

                        Text(CustomerOfferDetailCopy.timeLine(for: offer))
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(PFColor.passTimeBlock)
                            .padding(.top, 6)
                    }
                }
                .customerAppearAnimation(staggerIndex: 1)

                whatHappensNextCard(offer)
                    .customerAppearAnimation(staggerIndex: 2)

                statusSection(status)
                    .customerAppearAnimation(staggerIndex: 3)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 120)
        }
        .background(CustomerScreenBackground())
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if let slotId = offer.openSlotId, !slotId.isEmpty {
                CustomerStickyActionBar {
                    if viewModel.canClaim {
                        NavigationLink {
                            ClaimSlotView(openSlotId: slotId)
                                .environmentObject(env)
                        } label: {
                            CustomerPrimaryChromeLabel(title: viewModel.primaryActionTitle)
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(
                            TapGesture().onEnded { _ in
                                PFHaptics.lightImpact()
                            }
                        )
                    } else {
                        CustomerPrimaryButton(
                            title: viewModel.primaryActionTitle,
                            isEnabled: false,
                            onDisabledTap: {},
                            action: {}
                        )
                    }
                }
            }
        }
    }

    private func whatHappensNextCard(_ offer: CustomerOfferDetail) -> some View {
        let title = offer.claimGuidance?.title ?? "What happens next"
        let detail = offer.claimGuidance?.detail
            ?? "If you claim this opening, the clinic will confirm your booking and we’ll keep your status updated."

        return CustomerSectionCard {
            VStack(alignment: .leading, spacing: 10) {
                Text(title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(detail)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(PFColor.customerMutedText)
                    .lineSpacing(3)
            }
        }
    }

    private func statusSection(_ status: CustomerOfferDisplayStatus) -> some View {
        CustomerSectionCard {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 6) {
                    PFTypography.Customer.label("Status")
                    Text(status.label)
                        .font(.system(size: 19, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                }
                Spacer()
                CustomerStatusPill(text: status.label, tone: status.pillToneOnDark)
                    .customerStatusPillPulse(trigger: statusPulseTick)
            }
        }
    }
}
