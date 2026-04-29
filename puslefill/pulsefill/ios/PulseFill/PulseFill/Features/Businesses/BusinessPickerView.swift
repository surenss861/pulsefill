import SwiftUI

/// Customer-facing directory: businesses that turned on discovery in PulseFill.
struct BusinessPickerView: View {
    @EnvironmentObject private var env: AppEnvironment

    @State private var businesses: [CustomerDirectoryBusinessSummary] = []
    @State private var loading = true
    @State private var loadError: String?

    var body: some View {
        Group {
            if loading {
                ProgressView()
                    .tint(PFColor.ember)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let loadError {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Couldn’t load businesses")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                    Text(loadError)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                    Button("Try again") {
                        Task { await load() }
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(PFColor.primaryText)
                }
                .padding(20)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            } else if businesses.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("No listings yet")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                    Text(
                        "When a clinic turns on discovery in PulseFill, it will show up here. You can still connect with an invite from your clinic."
                    )
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                }
                .padding(20)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            } else {
                List(businesses) { row in
                    NavigationLink {
                        CustomerBusinessDetailView(businessId: row.id)
                            .environmentObject(env)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(row.name)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(PFColor.textPrimary)
                            if let cat = row.category, !cat.isEmpty {
                                Text(cat)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(PFColor.textMuted)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                .scrollContentBackground(.hidden)
            }
        }
        .background(CustomerScreenBackground())
        .navigationTitle("Find businesses")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            await load()
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

    var body: some View {
        Group {
            if loading {
                ProgressView()
                    .tint(PFColor.ember)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let loadError {
                Text(loadError)
                    .foregroundStyle(PFColor.textSecondary)
                    .padding()
            } else if let detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(detail.business.name)
                                .font(.system(size: 24, weight: .bold))
                                .foregroundStyle(PFColor.textPrimary)
                            if let cat = detail.business.category, !cat.isEmpty {
                                Text(cat)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundStyle(PFColor.textMuted)
                            }
                        }

                        if !detail.locations.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Locations")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(PFColor.textMuted)
                                ForEach(detail.locations) { loc in
                                    Text(locationLine(loc))
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundStyle(PFColor.textPrimary)
                                }
                            }
                        }

                        if !detail.services.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Services")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(PFColor.textMuted)
                                ForEach(detail.services.filter { ($0.active ?? true) }) { svc in
                                    HStack {
                                        Text(svc.name)
                                            .font(.system(size: 15, weight: .medium))
                                            .foregroundStyle(PFColor.textPrimary)
                                        if let m = svc.durationMinutes {
                                            Text("· \(m) min")
                                                .font(.system(size: 14, weight: .medium))
                                                .foregroundStyle(PFColor.textMuted)
                                        }
                                    }
                                }
                            }
                        }

                        accessCallout(for: detail.business)

                        if let actionMessage {
                            Text(actionMessage)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(PFColor.textSecondary)
                                .padding(.top, 4)
                        }
                        if let actionError {
                            Text(actionError)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(PFColor.error)
                        }

                        ctaSection(for: detail.business)
                    }
                    .padding(20)
                }
            }
        }
        .background(CustomerScreenBackground())
        .navigationBarTitleDisplayMode(.inline)
        .task(id: businessId) {
            await loadDetail()
        }
    }

    @ViewBuilder
    private func accessCallout(for business: CustomerDirectoryBusinessRow) -> some View {
        let mode = business.standbyAccessMode ?? "private"
        VStack(alignment: .leading, spacing: 8) {
            Text("How to connect")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PFColor.textMuted)
            switch mode {
            case "public":
                Text("You can join this clinic’s standby list from here. You’ll still set your preferences before openings arrive.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            case "request_to_join":
                Text("Send a short request. The clinic reviews it before you can set standby preferences.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            default:
                Text("This clinic connects new patients through an invite. Ask them for an invite link or code.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            }
        }
    }

    @ViewBuilder
    private func ctaSection(for business: CustomerDirectoryBusinessRow) -> some View {
        let mode = business.standbyAccessMode ?? "private"
        switch mode {
        case "public":
            Button {
                Task { await runIntent(message: nil) }
            } label: {
                Text(acting ? "Working…" : "Join standby list")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(PFColor.ember)
            .disabled(acting)

        case "request_to_join":
            VStack(alignment: .leading, spacing: 10) {
                TextField("Optional note to the clinic", text: $requestNote, axis: .vertical)
                    .lineLimit(3 ... 6)
                    .textFieldStyle(.roundedBorder)
                Button {
                    let trimmed = requestNote.trimmingCharacters(in: .whitespacesAndNewlines)
                    Task { await runIntent(message: trimmed.isEmpty ? nil : trimmed) }
                } label: {
                    Text(acting ? "Sending…" : "Request to join")
                        .font(.system(size: 17, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(PFColor.ember)
                .disabled(acting)
            }

        default:
            EmptyView()
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
            switch res.outcome {
            case "joined_standby":
                actionMessage = "You’re on the list. Open Profile → Standby preferences when you’re ready."
            case "request_submitted":
                actionMessage = "Request sent. The clinic will review it."
            case "request_pending":
                actionMessage = "You already have a request waiting."
            case "already_connected":
                actionMessage = "You’re already connected with this clinic."
            default:
                actionMessage = "Done."
            }
        } catch {
            actionError = error.localizedDescription
        }
    }
}
