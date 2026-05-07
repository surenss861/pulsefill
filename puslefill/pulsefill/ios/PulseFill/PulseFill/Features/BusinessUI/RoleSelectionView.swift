import SwiftUI

/// Dual-role gate: customer vs business mode for this session (persists in `UserRoleContext.surfaceChoice`).
struct RoleSelectionView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        ZStack {
            PFScreenBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 10) {
                        PFTypography.Customer.screenSubtitle("PulseFill")
                        PFTypography.Customer.screenTitle("Choose how you’re using PulseFill")
                            .multilineTextAlignment(.leading)
                        PFTypography.Customer.screenLead(
                            "You can use PulseFill as a customer, as business staff, or switch later in Settings."
                        )
                    }
                    .padding(.top, 8)

                    roleCard(
                        title: "Customer",
                        message: "Watch for openings, manage standby, and receive alerts from businesses you’ve joined.",
                        buttonTitle: "Continue as customer",
                        action: {
                            PFHaptics.lightImpact()
                            env.userRoleContext.chooseCustomerMode()
                        }
                    )

                    roleCard(
                        title: "Business",
                        message: "Recover openings, review claims, and keep your standby pool moving.",
                        buttonTitle: "Continue as business",
                        action: {
                            PFHaptics.lightImpact()
                            env.userRoleContext.chooseBusinessMode()
                        }
                    )
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 40)
            }
        }
    }

    private func roleCard(title: String, message: String, buttonTitle: String, action: @escaping () -> Void) -> some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(message)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                PFCustomerPrimaryButton(title: buttonTitle, action: action)
            }
        }
    }
}
