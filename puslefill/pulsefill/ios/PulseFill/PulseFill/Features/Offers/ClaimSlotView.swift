import SwiftUI

private struct ClaimOutcomeNav: Identifiable, Hashable {
    let id: String
}

struct ClaimSlotView: View {
    @EnvironmentObject private var env: AppEnvironment

    let openSlotId: String

    @State private var loading = false
    @State private var errorMessage: String?
    @State private var outcomeNav: ClaimOutcomeNav?

    var body: some View {
        VStack(spacing: PFSpacing.lg) {
            Spacer()
            Image(systemName: "bolt.circle")
                .font(.system(size: 48, weight: .semibold))
                .foregroundStyle(PFColor.primary)
            PFTypography.title("Ready to claim?")
            PFTypography.caption(
                "If the slot is still available, PulseFill will lock it for you right away."
            )
            .multilineTextAlignment(.center)

            if let errorMessage {
                PFTypography.caption(errorMessage)
                    .foregroundStyle(PFColor.error)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, PFSpacing.lg)
            }

            Spacer()

            Button {
                Task { await claim() }
            } label: {
                HStack {
                    if loading {
                        ProgressView().tint(.black)
                    }
                    Text(loading ? "Claiming…" : "Confirm claim")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(PFPrimaryButtonStyle())
            .disabled(loading)
            .padding(.horizontal, PFSpacing.lg)
        }
        .padding(PFSpacing.xl)
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Claim")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $outcomeNav) { nav in
            ClaimOutcomeView(api: env.apiClient, claimId: nav.id)
        }
    }

    private func claim() async {
        loading = true
        errorMessage = nil
        Haptics.selection()
        defer { loading = false }

        do {
            let res = try await env.apiClient.post(
                "/v1/open-slots/\(openSlotId)/claim",
                body: EmptyJSON(),
                as: ClaimOpenSlotResponse.self
            )
            guard res.ok else {
                errorMessage = "This opening could not be claimed right now."
                Haptics.error()
                return
            }
            let id = res.claim?.id ?? res.claimId
            guard let id, !id.isEmpty else {
                errorMessage = "Claim succeeded but no reference was returned."
                Haptics.error()
                return
            }
            outcomeNav = ClaimOutcomeNav(id: id)
            Haptics.success()
        } catch {
            errorMessage = APIErrorCopy.message(for: error)
            Haptics.error()
        }
    }
}
