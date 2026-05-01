import SwiftUI

/// Customer-facing directory: businesses that turned on discovery in PulseFill.
struct BusinessPickerView: View {
    @EnvironmentObject private var env: AppEnvironment

    @State private var businesses: [CustomerDirectoryBusinessSummary] = []
    @State private var loading = true
    @State private var loadError: String?

    var body: some View {
        ZStack {
            PFScreenBackground()

            Group {
                if loading && businesses.isEmpty {
                    PFCustomerLoadingState(
                        title: "Loading businesses…",
                        message: "Finding businesses you can connect with.",
                        compact: false
                    )
                } else if let loadError {
                    ScrollView {
                        PFCustomerErrorState(
                            title: "We couldn’t load businesses",
                            message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(loadError),
                            primaryTitle: "Try again",
                            primaryAction: { Task { await load() } },
                            secondaryTitle: nil,
                            secondaryAction: nil
                        )
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                    }
                } else if businesses.isEmpty {
                    ScrollView {
                        CustomerEmptyStateCard(
                            systemImage: "building.2",
                            title: "No businesses yet",
                            message: "Businesses that accept standby customers will appear here.",
                            footnote: nil
                        )
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                    }
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            PFTypography.Customer.screenLead(
                                "Find businesses using PulseFill and join standby lists for openings that match your preferences."
                            )
                            .fixedSize(horizontal: false, vertical: true)

                            ForEach(businesses) { row in
                                NavigationLink {
                                    CustomerBusinessDetailView(businessId: row.id)
                                        .environmentObject(env)
                                } label: {
                                    directorySummaryRow(row)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 24)
                    }
                }
            }
        }
        .navigationTitle("Find businesses")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            await load()
        }
    }

    private func directorySummaryRow(_ row: CustomerDirectoryBusinessSummary) -> some View {
        PFCustomerSectionCard(variant: .default, padding: 16) {
            HStack(alignment: .center, spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(row.name)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                        .multilineTextAlignment(.leading)

                    if let cat = row.category, !cat.isEmpty {
                        Text(cat)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.textMuted)
                            .lineLimit(2)
                    }

                    CustomerStatusPill(
                        text: CustomerBusinessAccessPolicyCopy.listChipLabel(for: row.standbyAccessMode),
                        tone: .onDarkEmber
                    )
                }

                Spacer(minLength: 8)

                VStack(alignment: .trailing, spacing: 6) {
                    Text("View business")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PFColor.ember)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.textMuted)
                }
            }
        }
    }

    @MainActor
    private func load() async {
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            let res = try await env.apiClient.getCustomerDirectoryBusinesses()
            businesses = res.businesses
        } catch {
            loadError = error.localizedDescription
            businesses = []
        }
    }
}

// MARK: - Detail

struct CustomerBusinessDetailView: View {
    @EnvironmentObject private var env: AppEnvironment
    let businessId: String

    @State private var detail: CustomerDirectoryBusinessDetailResponse?
    @State private var loading = true
    @State private var loadError: String?
    @State private var actionMessage: String?
    @State private var actionError: String?
    @State private var acting = false
    @State private var requestNote = ""

    private var navigationTitleText: String {
        detail?.business.name ?? "Business"
    }

    var body: some View {
        Group {
            if loading {
                ZStack {
                    PFScreenBackground()
                    PFCustomerLoadingState(
                        title: "Loading business…",
                        message: "Getting the latest details for this business.",
                        compact: false
                    )
                }
            } else if let loadError {
                ZStack {
                    PFScreenBackground()
                    ScrollView {
                        PFCustomerErrorState(
                            title: "We couldn’t load this business",
                            message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(loadError),
                            primaryTitle: "Try again",
                            primaryAction: { Task { await loadDetail() } },
                            secondaryTitle: nil,
                            secondaryAction: nil
                        )
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                    }
                }
            } else if let detail {
                businessDetailContent(detail)
            }
        }
        .background(PFScreenBackground())
        .navigationTitle(navigationTitleText)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .tint(PFColor.ember)
        .task(id: businessId) {
            await loadDetail()
        }
    }

    @ViewBuilder
    private func businessDetailContent(_ detail: CustomerDirectoryBusinessDetailResponse) -> some View {
        let state = CustomerBusinessConnectionUIState.resolve(
            accessModeRaw: detail.business.standbyAccessMode,
            relationship: detail.customerRelationship
        )

        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                BusinessConnectionCard(
                    businessId: businessId,
                    businessName: detail.business.name,
                    state: state,
                    accessModeRaw: detail.business.standbyAccessMode,
                    requestNote: $requestNote,
                    isSubmitting: acting,
                    onJoin: {
                        Task { await runIntent(message: nil) }
                    },
                    onRequestAccess: {
                        let trimmed = requestNote.trimmingCharacters(in: .whitespacesAndNewlines)
                        Task { await runIntent(message: trimmed.isEmpty ? nil : trimmed) }
                    },
                    onInviteCode: {
                        PFHaptics.lightImpact()
                        env.customerNavigation.openProfileInviteEntry()
                    }
                )
                .environmentObject(env)

                overviewSection(detail)
                servicesSection(detail)
                locationsSection(detail)

                PFCustomerInfoCallout(
                    title: "How standby works",
                    message: "Set your preferences once you’re connected. When an opening matches, it appears in Openings so you can claim it.",
                    variant: .neutral
                )

                if let actionMessage, !actionMessage.isEmpty {
                    Text(actionMessage)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                }
                if let actionError, !actionError.isEmpty {
                    Text(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(actionError))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.error)
                        .lineSpacing(3)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 24)
        }
    }

    private func overviewSection(_ detail: CustomerDirectoryBusinessDetailResponse) -> some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                PFTypography.Customer.label("About this business")

                Text(detail.business.name)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                if let cat = detail.business.category, !cat.isEmpty {
                    Text(cat)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textMuted)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(CustomerBusinessAccessPolicyCopy.headline(for: detail.business.standbyAccessMode))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)

                    Text(CustomerBusinessAccessPolicyCopy.detail(for: detail.business.standbyAccessMode))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                }
                .padding(.top, 4)
            }
        }
    }

    @ViewBuilder
    private func servicesSection(_ detail: CustomerDirectoryBusinessDetailResponse) -> some View {
        let activeServices = detail.services.filter { ($0.active ?? true) }

        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Services")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                if activeServices.isEmpty {
                    Text("Services are not listed yet.")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                } else {
                    Text("These are the services customers can set standby preferences for.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textMuted)
                        .lineSpacing(3)

                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(activeServices) { svc in
                            HStack(alignment: .firstTextBaseline) {
                                Text(svc.name)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(PFColor.textPrimary)
                                if let m = svc.durationMinutes {
                                    Text("· \(m) min")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundStyle(PFColor.textMuted)
                                }
                                Spacer(minLength: 0)
                            }
                        }
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    @ViewBuilder
    private func locationsSection(_ detail: CustomerDirectoryBusinessDetailResponse) -> some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Locations")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                if detail.locations.isEmpty {
                    Text("Locations are not listed yet.")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                } else {
                    Text("Openings may be available at these locations.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textMuted)
                        .lineSpacing(3)

                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(detail.locations) { loc in
                            Text(locationLine(loc))
                                .font(.system(size: 16, weight: .medium))
                                .foregroundStyle(PFColor.textPrimary)
                        }
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    private func locationLine(_ loc: CustomerDirectoryLocationRow) -> String {
        let parts = [loc.city, loc.region].compactMap { $0 }.filter { !$0.isEmpty }
        if parts.isEmpty { return loc.name }
        return "\(loc.name) · \(parts.joined(separator: ", "))"
    }

    @MainActor
    private func loadDetail() async {
        loading = true
        loadError = nil
        actionMessage = nil
        actionError = nil
        defer { loading = false }
        do {
            detail = try await env.apiClient.getCustomerDirectoryBusinessDetail(businessId: businessId)
        } catch {
            loadError = error.localizedDescription
            detail = nil
        }
    }

    @MainActor
    private func runIntent(message: String?) async {
        acting = true
        actionError = nil
        actionMessage = nil
        defer { acting = false }
        do {
            let res = try await env.apiClient.postCustomerStandbyIntent(businessId: businessId, message: message)
            await loadDetail()
            if res.outcome == "request_pending", res.result == "request_pending" {
                actionMessage = "You already have a request waiting."
            } else {
                actionMessage = nil
            }
        } catch {
            actionError = error.localizedDescription
        }
    }
}
