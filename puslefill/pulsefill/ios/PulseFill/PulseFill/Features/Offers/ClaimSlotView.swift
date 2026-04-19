import SwiftUI

struct ClaimSlotView: View {
    @EnvironmentObject private var env: AppEnvironment

    let openSlotId: String

    @State private var loading = false
    @State private var resultVM: ClaimResultViewModel?

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
        .navigationDestination(item: $resultVM) { vm in
            ClaimResultView(viewModel: vm)
        }
    }

    private func claim() async {
        loading = true
        Haptics.selection()
        defer { loading = false }

        do {
            let res = try await env.apiClient.post(
                "/v1/open-slots/\(openSlotId)/claim",
                body: EmptyJSON(),
                as: ClaimOpenSlotResponse.self
            )
            guard res.ok else {
                resultVM = ClaimResultViewModel(outcome: .failed("This opening could not be claimed right now."))
                Haptics.error()
                return
            }
            let id = res.claim?.id ?? res.claimId
            resultVM = ClaimResultViewModel(outcome: .success(claimId: id))
            Haptics.success()
        } catch {
            resultVM = ClaimResultViewModel(outcome: .failed(APIErrorCopy.message(for: error)))
            Haptics.error()
        }
    }
}
