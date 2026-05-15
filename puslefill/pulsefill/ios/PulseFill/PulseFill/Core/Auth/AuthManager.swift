import Combine
import Foundation

@MainActor
final class AuthManager: ObservableObject {
    @Published private(set) var isBusy = false

    private let passwordAuth: any PulseFillPasswordAuthClient
    private let sessionStore: SessionStore
    private let apiClient: APIClient
    private let pushRegistrationManager: PushRegistrationManager
    private let userRoleContext: UserRoleContext

    enum InviteAcceptResult {
        case success
        case failure(String)
    }

    init(
        authClient: any PulseFillPasswordAuthClient,
        sessionStore: SessionStore,
        apiClient: APIClient,
        pushRegistrationManager: PushRegistrationManager,
        userRoleContext: UserRoleContext
    ) {
        self.passwordAuth = authClient
        self.sessionStore = sessionStore
        self.apiClient = apiClient
        self.pushRegistrationManager = pushRegistrationManager
        self.userRoleContext = userRoleContext
    }

    func restoreSessionIfNeeded() async {
        let accessToken = sessionStore.accessToken?.nilIfEmpty
        let refreshToken = sessionStore.refreshToken?.nilIfEmpty
        guard accessToken != nil || refreshToken != nil else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            let bundle = try await restoreSessionBundle(accessToken: accessToken, refreshToken: refreshToken)
            sessionStore.applySession(
                accessToken: bundle.accessToken,
                refreshToken: bundle.refreshToken ?? refreshToken,
                userId: bundle.userId,
                email: bundle.email
            )
            try await syncCustomerSession()
            await refreshStaffAccess()
            await userRoleContext.refreshFromServer(legacyMigrationHint: true)
        } catch {
            #if DEBUG
            print("AuthManager.restoreSessionIfNeeded error: \(error)")
            #endif
            sessionStore.clear()
            userRoleContext.resetForSignOut()
        }
    }

    private func restoreSessionBundle(accessToken: String?, refreshToken: String?) async throws -> AuthSessionBundle {
        if let accessToken {
            do {
                return try await passwordAuth.fetchUserIfSessionValid(accessToken: accessToken)
            } catch {
                guard let refreshToken else { throw error }
                return try await passwordAuth.refreshSession(refreshToken: refreshToken)
            }
        }

        guard let refreshToken else { throw APIError.status(code: 401, body: nil) }
        return try await passwordAuth.refreshSession(refreshToken: refreshToken)
    }

    /// Sign-in after the form passes local validation. Returns `.failed(.validation)` if inputs are empty (defense-in-depth).
    func performSignIn(email: String, password: String) async -> AuthFormSignInOutcome {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        switch AuthFormValidation.submitValidation(email: trimmedEmail, password: password, mode: .signIn) {
        case let .failure(banner, reason):
            let qa = AuthPipelineQAExport.make(
                email: email,
                password: password,
                mode: .signIn,
                validationReason: reason,
                phase: "localValidation",
                outcomeKind: "validation"
            )
            return .failed(banner: banner, qa: qa)
        case .ok:
            break
        }

        #if DEBUG
        print("AuthManager.performSignIn: validation OK, Supabase password grant starting")
        #endif
        isBusy = true
        defer { isBusy = false }

        let bundle: AuthSessionBundle
        do {
            bundle = try await passwordAuth.signInWithPassword(email: trimmedEmail, password: password)
        } catch let v as SupabaseAuthClientValidationError {
            let qa = AuthPipelineQAExport.make(
                email: email,
                password: password,
                mode: .signIn,
                validationReason: Self.qaReason(for: v),
                phase: "supabase",
                outcomeKind: "validation"
            )
            return .failed(banner: v.authFormBanner, qa: qa)
        } catch {
            #if DEBUG
            print("AuthManager.performSignIn: Supabase password grant failed: \(error)")
            #endif
            let mapped = AuthRemoteFailureMapper.mapSupabasePasswordGrantFailure(
                error: error,
                email: email,
                password: password,
                mode: .signIn
            )
            return .failed(banner: mapped.banner, qa: mapped.qa)
        }

        #if DEBUG
        print("AuthManager.performSignIn: Supabase OK, session sync starting")
        #endif

        sessionStore.applySession(
            accessToken: bundle.accessToken,
            refreshToken: bundle.refreshToken,
            userId: bundle.userId,
            email: bundle.email
        )

        do {
            _ = try await syncCustomerSession()
        } catch {
            sessionStore.clear()
            userRoleContext.resetForSignOut()
            #if DEBUG
            print("AuthManager.performSignIn: session sync failed, cleared local session: \(error)")
            #endif
            let mapped = AuthRemoteFailureMapper.mapSessionSyncFailure(
                error: error,
                email: email,
                password: password,
                mode: .signIn
            )
            return .failed(banner: mapped.banner, qa: mapped.qa)
        }

        #if DEBUG
        print("AuthManager.performSignIn: session sync OK, refreshing role context")
        #endif
        await refreshStaffAccess()
        await userRoleContext.refreshFromServer(legacyMigrationHint: false)
        return .signedIn
    }

    func performSignUp(email: String, password: String) async -> AuthFormSignUpOutcome {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        switch AuthFormValidation.submitValidation(email: trimmedEmail, password: password, mode: .signUp) {
        case let .failure(banner, reason):
            let qa = AuthPipelineQAExport.make(
                email: email,
                password: password,
                mode: .signUp,
                validationReason: reason,
                phase: "localValidation",
                outcomeKind: "validation"
            )
            return .failed(banner: banner, qa: qa)
        case .ok:
            break
        }

        #if DEBUG
        print("AuthManager.performSignUp: validation OK, Supabase signup starting")
        #endif
        isBusy = true
        defer { isBusy = false }
        do {
            if let bundle = try await passwordAuth.signUpWithPassword(email: trimmedEmail, password: password) {
                sessionStore.applySession(
                    accessToken: bundle.accessToken,
                    refreshToken: bundle.refreshToken,
                    userId: bundle.userId,
                    email: bundle.email
                )
                do {
                    _ = try await syncCustomerSession()
                } catch {
                    sessionStore.clear()
                    userRoleContext.resetForSignOut()
                    #if DEBUG
                    print("AuthManager.performSignUp: session sync failed, cleared local session: \(error)")
                    #endif
                    let mapped = AuthRemoteFailureMapper.mapSessionSyncFailure(
                        error: error,
                        email: email,
                        password: password,
                        mode: .signUp
                    )
                    return .failed(banner: mapped.banner, qa: mapped.qa)
                }
                await refreshStaffAccess()
                await userRoleContext.refreshFromServer(legacyMigrationHint: false)
                return .signedIn
            }
            return .verifyEmailInbox
        } catch let v as SupabaseAuthClientValidationError {
            let qa = AuthPipelineQAExport.make(
                email: email,
                password: password,
                mode: .signUp,
                validationReason: Self.qaReason(for: v),
                phase: "supabase",
                outcomeKind: "validation"
            )
            return .failed(banner: v.authFormBanner, qa: qa)
        } catch {
            #if DEBUG
            print("AuthManager.performSignUp error: \(error)")
            #endif
            let mapped = AuthRemoteFailureMapper.mapSupabasePasswordGrantFailure(
                error: error,
                email: email,
                password: password,
                mode: .signUp
            )
            return .failed(banner: mapped.banner, qa: mapped.qa)
        }
    }

    func signOut() async {
        await pushRegistrationManager.deactivateCurrentDeviceIfNeeded()
        sessionStore.clear()
        userRoleContext.resetForSignOut()
    }

    /// Password reset email via Supabase Auth (`/auth/v1/recover`). Caller validates email; maps errors into `AuthFormBanner`.
    func performPasswordReset(email: String) async -> AuthFormBanner {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return .validation("Enter your email.")
        }
        if !AuthFormValidation.isValidSingleEmailFormat(trimmed) {
            return .validation("Enter a valid email address.")
        }
        isBusy = true
        defer { isBusy = false }
        do {
            try await passwordAuth.requestPasswordRecovery(email: trimmed)
            return .info("If we find an account for that email, we’ll send reset instructions.")
        } catch let v as SupabaseAuthClientValidationError {
            return v.authFormBanner
        } catch {
            #if DEBUG
            print("AuthManager.performPasswordReset error: \(error)")
            #endif
            return AuthFormBanner.fromSignInFlowError(error)
        }
    }

    /// Call after sign-in / restore to detect staff JWT (`GET /v1/businesses/mine`).
    func refreshStaffAccess() async {
        guard sessionStore.isSignedIn else {
            sessionStore.isStaffUser = false
            return
        }
        do {
            _ = try await apiClient.get("/v1/businesses/mine", as: Business.self)
            sessionStore.isStaffUser = true
        } catch {
            sessionStore.isStaffUser = false
        }
    }

    private func syncCustomerSession() async throws {
        _ = try await apiClient.postAuthSessionSync()
        await acceptPendingInviteIfNeeded()
    }

    /// Consumes `sessionStore.pendingInviteToken` (from deep link) after session sync. Failures do not block sign-in; the customer can accept from Profile.
    /// Call after a deep link stores a token; no-op if not signed in (token is consumed on next sign-in sync).
    func processPendingInviteTokenIfNeeded() async {
        await acceptPendingInviteIfNeeded()
    }

    private func acceptPendingInviteIfNeeded() async {
        guard let raw = sessionStore.pendingInviteToken?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
            return
        }
        guard sessionStore.isSignedIn else { return }
        do {
            let res = try await apiClient.acceptCustomerInvite(token: raw)
            sessionStore.pendingInviteToken = nil
            sessionStore.inviteSuccessBanner =
                "Invite accepted. Set your standby preferences so we know which openings to send."
            if res.needsStandbySetup {
                sessionStore.standbyOnboardingRecheck += 1
            }
        } catch {
            #if DEBUG
            print("AuthManager.acceptPendingInviteIfNeeded error: \(error)")
            #endif
            sessionStore.inviteSuccessBanner = nil
        }
    }

    /// Call when the user pastes a token while already signed in (Profile).
    func acceptInviteTokenNow(_ token: String) async -> InviteAcceptResult {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .failure("Enter the invite code from the business.") }
        isBusy = true
        defer { isBusy = false }
        do {
            let res = try await apiClient.acceptCustomerInvite(token: trimmed)
            sessionStore.inviteSuccessBanner =
                "Invite accepted. Set your standby preferences so we know which openings to send."
            if res.needsStandbySetup {
                sessionStore.standbyOnboardingRecheck += 1
            }
            return .success
        } catch {
            #if DEBUG
            print("AuthManager.acceptInviteTokenNow error: \(error)")
            #endif
            let message = PFCustomerFacingErrorCopy.sanitizeAuthMessage(error.localizedDescription)
            return .failure(message)
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

private extension AuthManager {
    static func qaReason(for error: SupabaseAuthClientValidationError) -> String {
        switch error {
        case .emptyEmail: "empty_email"
        case .invalidEmail: "invalid_email"
        case .emptyPassword: "empty_password"
        case .passwordTooShortForSignUp: "password_short"
        }
    }
}
