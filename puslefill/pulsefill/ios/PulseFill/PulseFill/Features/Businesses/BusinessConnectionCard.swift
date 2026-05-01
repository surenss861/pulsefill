import SwiftUI

/// Top “trust” card on business detail: connection state, copy, and primary actions.
struct BusinessConnectionCard: View {
    @EnvironmentObject private var env: AppEnvironment

    let businessId: String
    let businessName: String
    let state: CustomerBusinessConnectionUIState
    /// Used when `state` is `.requestNotApproved` to show the right retry path (join vs request form).
    let accessModeRaw: String?

    @Binding var requestNote: String
    var isSubmitting: Bool

    var onJoin: () -> Void
    var onRequestAccess: () -> Void
    var onInviteCode: () -> Void

    @ViewBuilder
    private var standbyDestination: some View {
        StandbyPreferencesView(
            api: env.apiClient,
            navigationTitleOverride: "Standby preferences",
            initialBusinessId: businessId,
            initialBusinessDisplayName: businessName,
            initialServiceId: nil,
            lockBusinessSelection: true
        )
        .environmentObject(env)
    }

    var body: some View {
        PFCustomerSectionCard(variant: state.sectionVariant, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                CustomerStatusPill(text: state.statusChipLabel, tone: state.statusChipTone)

                Text(state.title)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(state.message)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                if state == .requestAccess || requestNotApprovedShowsRequestForm {
                    TextField("Add a short note (optional)", text: $requestNote, axis: .vertical)
                        .lineLimit(3 ... 6)
                        .font(.system(size: 15, weight: .medium))
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(PFColor.customerCard)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(PFColor.hairline, lineWidth: 1)
                        )
                }

                VStack(spacing: 10) {
                    switch state {
                    case .publicJoin:
                        PFCustomerPrimaryButton(
                            title: "Join standby",
                            isEnabled: !isSubmitting,
                            isLoading: isSubmitting,
                            action: onJoin
                        )

                    case .requestAccess:
                        PFCustomerPrimaryButton(
                            title: "Request access",
                            isEnabled: !isSubmitting,
                            isLoading: isSubmitting,
                            action: onRequestAccess
                        )

                    case .connectedNeedsStandby:
                        NavigationLink {
                            standbyDestination
                        } label: {
                            CustomerPrimaryChromeLabel(title: "Set up standby")
                        }
                        .buttonStyle(.plain)

                    case .standbyActive:
                        NavigationLink {
                            standbyDestination
                        } label: {
                            Text("Edit preferences")
                                .font(.system(size: 17, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .buttonStyle(.bordered)
                        .tint(PFColor.ember)

                    case .inviteRequired:
                        PFCustomerSecondaryButton(title: "I have an invite code", isEnabled: true, action: onInviteCode)

                    case .requestNotApproved:
                        if accessModeRaw?.lowercased() == "public" {
                            PFCustomerPrimaryButton(
                                title: "Join standby",
                                isEnabled: !isSubmitting,
                                isLoading: isSubmitting,
                                action: onJoin
                            )
                        } else if accessModeRaw?.lowercased() == "request_to_join" {
                            PFCustomerPrimaryButton(
                                title: "Request access",
                                isEnabled: !isSubmitting,
                                isLoading: isSubmitting,
                                action: onRequestAccess
                            )
                        } else {
                            PFCustomerSecondaryButton(title: "I have an invite code", isEnabled: true, action: onInviteCode)
                        }

                    case .waitingForApproval, .unknown:
                        EmptyView()
                    }
                }
                .padding(.top, 2)
            }
        }
    }

    private var requestNotApprovedShowsRequestForm: Bool {
        state == .requestNotApproved && accessModeRaw?.lowercased() == "request_to_join"
    }
}
