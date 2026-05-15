import SwiftUI

/// Customer-facing directory: businesses that turned on discovery in PulseFill.
struct BusinessPickerView: View {
    @EnvironmentObject private var env: AppEnvironment

    @State private var businesses: [CustomerDirectoryBusinessSummary] = []
    @State private var selectedCategoryChip: String?
    @State private var loading = true
    @State private var loadError: String?

    private let categoryChips = ["Dental", "Physio", "Salon", "Wellness", "Massage"]

    private var displayedBusinesses: [CustomerDirectoryBusinessSummary] {
        guard let chip = selectedCategoryChip else { return businesses }
        return businesses.filter { row in
            (row.category ?? "").localizedCaseInsensitiveContains(chip)
                || (row.services ?? []).contains { $0.localizedCaseInsensitiveContains(chip) }
        }
    }

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
                            title: "We couldn’t load businesses right now",
                            message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(loadError),
                            primaryTitle: "Try again",
                            primaryAction: { Task { await load() } },
                            secondaryTitle: nil,
                            secondaryAction: nil,
                            hint: "Try again in a moment, or check that PulseFill is connected.",
                            style: .compact
                        )
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                    }
                } else if businesses.isEmpty {
                    ScrollView {
                        CustomerEmptyStateCard(
                            systemImage: "building.2",
                            title: "No businesses yet",
                            message: "Join a business to get alerts when someone cancels an appointment.",
                            footnote: nil,
                            primaryActionTitle: "Use invite code",
                            primaryAction: { env.customerNavigation.openProfileInviteEntry() },
                            secondaryActionTitle: "Refresh",
                            secondaryAction: { Task { await load() } }
                        )
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                        .pfCustomerTabBarContentInset()
                    }
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            PFTypography.Customer.screenLead(
                                "Find businesses and join their waiting lists. When someone cancels, you’ll get an alert in Openings."
                            )
                            .fixedSize(horizontal: false, vertical: true)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    categoryChip(title: "All", isSelected: selectedCategoryChip == nil) {
                                        selectedCategoryChip = nil
                                    }
                                    ForEach(categoryChips, id: \.self) { title in
                                        categoryChip(title: title, isSelected: selectedCategoryChip == title) {
                                            selectedCategoryChip = selectedCategoryChip == title ? nil : title
                                        }
                                    }
                                }
                            }

                            if displayedBusinesses.isEmpty {
                                CustomerEmptyStateCard(
                                    systemImage: "line.3.horizontal.decrease.circle",
                                    title: "No matches",
                                    message: "Try another category or clear the filter to see every business.",
                                    footnote: nil
                                )
                            } else {
                                ForEach(displayedBusinesses) { row in
                                    NavigationLink {
                                        CustomerBusinessDetailView(businessId: row.id)
                                            .environmentObject(env)
                                    } label: {
                                        directorySummaryRow(row)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 24)
                        .pfCustomerTabBarContentInset()
                    }
                }
            }
        }
        .navigationTitle("Find appointments")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            await load()
        }
    }

    private func categoryChip(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: {
            PFHaptics.selection()
            action()
        }) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .foregroundStyle(isSelected ? PFColor.emberText : PFColor.textSecondary)
                .background(
                    Capsule()
                        .fill(isSelected ? PFColor.ember : PFColor.customerCard)
                )
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Color.clear : PFColor.customerHairline, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func directorySummaryRow(_ row: CustomerDirectoryBusinessSummary) -> some View {
        PFCustomerSectionCard(variant: .default, padding: 16) {
            HStack(alignment: .center, spacing: 14) {
                directoryListLogo(urlString: row.logoUrl)

                VStack(alignment: .leading, spacing: 8) {
                    Text(row.name)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                        .multilineTextAlignment(.leading)

                    let placeParts = [row.neighborhood, row.city]
                        .compactMap { $0 }
                        .filter { !$0.isEmpty }
                        .joined(separator: " · ")
                    let metaPieces = [row.category, placeParts.isEmpty ? nil : placeParts].compactMap { $0 }.filter { !$0.isEmpty }
                    if !metaPieces.isEmpty {
                        Text(metaPieces.joined(separator: " · "))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.textMuted)
                            .lineLimit(2)
                    }

                    if let desc = row.description, !desc.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text(desc)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                            .lineSpacing(3)
                            .lineLimit(3)
                    }

                    if let note = row.joinNote, !note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text(note)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(PFColor.textSecondary)
                            .lineLimit(2)
                    }

                    HStack(spacing: 8) {
                        CustomerStatusPill(
                            text: CustomerBusinessAccessPolicyCopy.listChipLabel(for: row.standbyAccessMode),
                            tone: .onDarkEmber
                        )
                        if let rel = row.relationship {
                            CustomerStatusPill(
                                text: listRelationshipChip(rel),
                                tone: rel.membershipStatus == "active" ? .success : .onDarkNeutral
                            )
                        }
                    }
                }

                Spacer(minLength: 8)

                VStack(alignment: .trailing, spacing: 6) {
                    Text("View")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PFColor.ember)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.textMuted)
                }
            }
        }
    }

    @ViewBuilder
    private func directoryListLogo(urlString: String?) -> some View {
        if let s = urlString?.trimmingCharacters(in: .whitespacesAndNewlines),
           let u = directoryHTTPSURL(s)
        {
            AsyncImage(url: u) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                case .failure:
                    directoryListLogoPlaceholder()
                default:
                    directoryListLogoPlaceholder()
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        } else {
            directoryListLogoPlaceholder()
        }
    }

    private func directoryListLogoPlaceholder() -> some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(PFColor.customerCard)
            .frame(width: 48, height: 48)
            .overlay {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(PFColor.textMuted)
            }
    }

    private func listRelationshipChip(_ rel: CustomerDirectoryListRelationship) -> String {
        if rel.membershipStatus == "active" { return "Joined" }
        if rel.requestStatus == "pending" { return "Request pending" }
        if rel.requestStatus == "declined" { return "Not approved" }
        return "Not connected"
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
            loadError = APIErrorCopy.message(for: error)
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
                            secondaryAction: nil,
                            hint: "Try again in a moment, or check that PulseFill is connected.",
                            style: .compact
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
            relationship: detail.business.relationship
        )

        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                if let coverStr = detail.business.coverImageUrl,
                   let coverURL = directoryHTTPSURL(coverStr)
                {
                    AsyncImage(url: coverURL) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        case .failure:
                            Color.clear.frame(height: 0)
                        default:
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(PFColor.customerCard)
                                .frame(height: 140)
                                .overlay { ProgressView().tint(PFColor.ember) }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                }

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

                let placeLine = [detail.business.neighborhood, detail.business.city]
                    .compactMap { $0 }
                    .filter { !$0.isEmpty }
                    .joined(separator: " · ")
                let metaPieces = [detail.business.category, placeLine.isEmpty ? nil : placeLine]
                    .compactMap { $0 }
                    .filter { !$0.isEmpty }
                if !metaPieces.isEmpty {
                    Text(metaPieces.joined(separator: " · "))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textMuted)
                        .lineLimit(3)
                }

                if let blurb = detail.business.description, !blurb.isEmpty {
                    Text(blurb)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                        .padding(.top, 2)
                }

                if let note = detail.business.joinNote, !note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text(note)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                }

                HStack(spacing: 16) {
                    if let web = detail.business.website, let u = directoryHTTPSURL(web) {
                        Link(destination: u) {
                            Label("Website", systemImage: "safari")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .tint(PFColor.ember)
                    }
                    if let phone = detail.business.phone?.trimmingCharacters(in: .whitespacesAndNewlines),
                       !phone.isEmpty,
                       let tel = URL(string: "tel:\(phone.filter { $0.isNumber })")
                    {
                        Link(destination: tel) {
                            Label("Call", systemImage: "phone")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .tint(PFColor.ember)
                    }
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
        let activeServices = detail.business.services.filter { ($0.active ?? true) }

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

                if detail.business.locations.isEmpty {
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
                        ForEach(detail.business.locations) { loc in
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
            loadError = APIErrorCopy.message(for: error)
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
            let res = try await env.apiClient.postCustomerDirectoryRequestToJoin(businessId: businessId, message: message)
            await loadDetail()
            if res.outcome == "request_pending", res.result == "request_pending" {
                actionMessage = "You already have a request waiting."
            } else {
                actionMessage = nil
            }
        } catch {
            actionError = APIErrorCopy.message(for: error)
        }
    }
}

private func directoryHTTPSURL(_ raw: String) -> URL? {
    let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let u = URL(string: t), let scheme = u.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
        return nil
    }
    return u
}
