import SwiftUI

/// Operator-facing workspace identity resolved from `/v1/auth/me` (+ session email fallback).
struct BusinessWorkspacePresentation: Equatable {
    let businessName: String
    let roleLabel: String
    let signedInEmail: String?

    static func resolve(authMe: PulseFillAuthMeResponse?, sessionEmail: String?) -> BusinessWorkspacePresentation {
        let biz = authMe?.staff?.businesses.first
        let nameRaw = biz?.businessName.trimmingCharacters(in: .whitespacesAndNewlines)
        let businessName = (nameRaw?.isEmpty == false) ? nameRaw! : "Your workspace"

        let roleRaw = biz?.role.trimmingCharacters(in: .whitespacesAndNewlines)
        let roleLabel = formattedStaffRole(roleRaw)

        let meEmail = authMe?.user.email?.trimmingCharacters(in: .whitespacesAndNewlines)
        let session = sessionEmail?.trimmingCharacters(in: .whitespacesAndNewlines)
        let signedInEmail: String? = {
            if let meEmail, !meEmail.isEmpty { return meEmail }
            if let session, !session.isEmpty { return session }
            return nil
        }()

        return BusinessWorkspacePresentation(
            businessName: businessName,
            roleLabel: roleLabel,
            signedInEmail: signedInEmail
        )
    }

    private static func formattedStaffRole(_ raw: String?) -> String {
        guard let raw, !raw.isEmpty else { return "Staff" }
        let spaced = raw.replacingOccurrences(of: "_", with: " ")
        let parts = spaced.split(separator: " ").map(\.localizedCapitalized)
        return parts.joined(separator: " ")
    }
}

/// Thin identity strip — use on main Business tabs so operators know which workspace they’re acting on.
struct BusinessWorkspaceStrip: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        let p = BusinessWorkspacePresentation.resolve(
            authMe: env.userRoleContext.authMe,
            sessionEmail: env.sessionStore.email
        )
        stripBody(presentation: p)
    }

    init() {}

    private func stripBody(presentation p: BusinessWorkspacePresentation) -> some View {
        HStack(alignment: .center, spacing: 10) {
            Image(systemName: "building.2.fill")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(PFColor.primary)

            VStack(alignment: .leading, spacing: 3) {
                Text("Workspace · \(p.businessName)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                Text("Role · \(p.roleLabel)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)

            Text("Business")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(PFColor.primaryText)
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(PFColor.primary.opacity(0.22))
                .clipShape(Capsule())
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.12), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Operating as \(p.businessName), role \(p.roleLabel), Business mode.")
    }
}
