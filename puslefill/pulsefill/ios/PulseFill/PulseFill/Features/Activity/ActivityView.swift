import SwiftUI

struct ActivityView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var items: [ActivityItemDTO] = []
    @State private var loading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                PFColor.background.ignoresSafeArea()
                Group {
                    if loading {
                        ProgressView("Loading activity…")
                            .tint(PFColor.primary)
                    } else if let errorMessage {
                        EmptyStateView(
                            title: "Couldn’t load activity",
                            message: errorMessage,
                            actionTitle: "Retry",
                            action: { Task { await load() } }
                        )
                    } else if items.isEmpty {
                        EmptyStateView(
                            title: "No activity yet",
                            message: "Claims you make will show here so you can track openings you grabbed."
                        )
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 14) {
                                ForEach(items) { item in
                                    VStack(alignment: .leading, spacing: 10) {
                                        Text(item.openSlot?.providerNameSnapshot ?? "Appointment")
                                            .font(.system(size: 17, weight: .semibold))
                                            .foregroundStyle(PFColor.textPrimary)
                                        Text(dateLine(for: item))
                                            .font(.system(size: 13))
                                            .foregroundStyle(PFColor.textSecondary)
                                        StatusChipView(status: item.status)
                                    }
                                    .appearUp()
                                    .padding(18)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(PFSurface.card)
                                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                                            .stroke(PFColor.divider, lineWidth: 1)
                                    )
                                    .padding(.horizontal, 20)
                                }
                            }
                            .padding(.vertical, 20)
                        }
                        .refreshable { await load() }
                    }
                }
            }
            .navigationTitle("Activity")
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task { await load() }
        }
    }

    private func dateLine(for item: ActivityItemDTO) -> String {
        guard let slot = item.openSlot else {
            return item.claimedAt.map { DateFormatterPF.medium($0) } ?? "Recent"
        }
        return "\(DateFormatterPF.short(slot.startsAt)) • \(DateFormatterPF.time(slot.startsAt))–\(DateFormatterPF.time(slot.endsAt))"
    }

    private func load() async {
        guard env.sessionStore.isSignedIn else {
            items = []
            errorMessage = "Sign in on the Home tab to view activity."
            return
        }
        loading = true
        errorMessage = nil
        defer { loading = false }
        do {
            let res = try await env.apiClient.get("/v1/customers/me/activity", as: ActivityResponse.self)
            items = res.activity
        } catch {
            errorMessage = APIErrorCopy.message(for: error)
        }
    }
}
