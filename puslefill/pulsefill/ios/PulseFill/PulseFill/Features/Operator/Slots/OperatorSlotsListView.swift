import SwiftUI

/// Lightweight operator list of open slots (jump-off to detail).
struct OperatorSlotsListView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var rows: [StaffOpenSlotListRow] = []
    @State private var loadError: String?
    @State private var loading = true
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if loading {
                    ProgressView().tint(PFColor.primary)
                } else if let loadError {
                    VStack(spacing: 12) {
                        Text(loadError)
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textSecondary)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await load() }
                        }
                        .buttonStyle(PFPrimaryButtonStyle())
                    }
                    .padding()
                } else {
                    List(rows) { row in
                        Button {
                            path.append(row.id)
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(row.providerNameSnapshot ?? "Open slot")
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(PFColor.textPrimary)
                                Text(DateFormatterPF.dateTimeRange(start: row.startsAt, end: row.endsAt))
                                    .font(.system(size: 13))
                                    .foregroundStyle(PFColor.textSecondary)
                                StatusChipView(status: row.status)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .scrollContentBackground(.hidden)
                    .listStyle(.plain)
                }
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Slots")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: String.self) { slotId in
                OperatorSlotDetailView(api: env.apiClient, slotId: slotId)
            }
            .task {
                await load()
            }
            .refreshable {
                await load()
            }
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        loadError = nil
        do {
            let res = try await env.apiClient.getStaffOpenSlots()
            rows = res.openSlots.sorted { $0.startsAt < $1.startsAt }
        } catch {
            loadError = APIErrorCopy.message(for: error)
        }
    }
}
