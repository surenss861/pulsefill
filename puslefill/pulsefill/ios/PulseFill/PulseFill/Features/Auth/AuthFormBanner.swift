import Foundation

/// TestFlight / QA-only auth pipeline snapshot (no email body, no password, no tokens).
struct AuthPipelineQAExport: Equatable, Sendable {
    var validationReason: String
    var emailEmpty: Bool
    var emailFormatOK: Bool
    var passwordEmpty: Bool
    var passwordTrimmedCount: Int
    var phase: String
    var supabaseStatusCode: Int?
    var supabaseErrorCode: String?
    var sessionSyncStatusCode: Int?
    var sessionSyncRequestId: String?
    var apiStatusCode: Int?
    var apiErrorCode: String?
    var apiRequestId: String?
    var outcomeKind: String

    var passwordFieldHint: String {
        "pwEmpty=\(passwordEmpty) · pwLen=\(passwordTrimmedCount)"
    }

    var primaryLine: String {
        let core = [
            "val=\(validationReason)",
            "ee=\(emailEmpty)",
            "ef=\(emailFormatOK)",
            "pe=\(passwordEmpty)",
            "pwLen=\(passwordTrimmedCount)",
            "phase=\(phase)",
        ].joined(separator: " · ")
        return "Auth: \(core)"
    }

    var secondaryLine: String {
        var parts: [String] = []
        let useApi = apiStatusCode != nil || !(apiErrorCode ?? "").isEmpty
        if useApi {
            if let c = apiStatusCode { parts.append("api=\(c)") }
            if let e = apiErrorCode, !e.isEmpty { parts.append("code=\(e)") }
            if let r = apiRequestId, !r.isEmpty { parts.append("rid=\(r)") }
        } else {
            if let c = supabaseStatusCode { parts.append("sb=\(c)") }
            if let e = supabaseErrorCode, !e.isEmpty { parts.append("sbErr=\(e)") }
            if let s = sessionSyncStatusCode { parts.append("sync=\(s)") }
            if let r = sessionSyncRequestId, !r.isEmpty { parts.append("syncRid=\(r)") }
        }
        parts.append("out=\(outcomeKind)")
        return "Auth: " + parts.joined(separator: " · ")
    }

    /// Default QA row before first interaction.
    static let idle = AuthPipelineQAExport(
        validationReason: "idle",
        emailEmpty: false,
        emailFormatOK: false,
        passwordEmpty: true,
        passwordTrimmedCount: 0,
        phase: "idle",
        supabaseStatusCode: nil,
        supabaseErrorCode: nil,
        sessionSyncStatusCode: nil,
        sessionSyncRequestId: nil,
        apiStatusCode: nil,
        apiErrorCode: nil,
        apiRequestId: nil,
        outcomeKind: "idle"
    )

    static func passwordQaRow(email: String, password: String, mode: AuthFormMode) -> String {
        let snap = fieldSnapshot(email: email, password: password, mode: mode)
        return "pwEmpty=\(snap.passwordEmpty) · pwLen=\(snap.passwordTrimmedCount)"
    }

    static func fieldSnapshot(email: String, password: String, mode: AuthFormMode) -> (
        emailEmpty: Bool,
        emailFormatOK: Bool,
        passwordEmpty: Bool,
        passwordTrimmedCount: Int,
        validationReason: String
    ) {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let pwTrim = password.trimmingCharacters(in: .whitespacesAndNewlines)
        let emailEmpty = trimmedEmail.isEmpty
        let emailFormatOK = AuthFormValidation.isValidSingleEmailFormat(trimmedEmail)
        let passwordEmpty = pwTrim.isEmpty
        let reason: String
        switch AuthFormValidation.submitValidation(email: trimmedEmail, password: password, mode: mode) {
        case .ok:
            reason = "ok"
        case .failure(_, let qaReason):
            reason = qaReason
        }
        return (emailEmpty, emailFormatOK, passwordEmpty, pwTrim.count, reason)
    }

    static func make(
        email: String,
        password: String,
        mode: AuthFormMode,
        validationReason: String? = nil,
        phase: String,
        supabaseStatusCode: Int? = nil,
        supabaseErrorCode: String? = nil,
        sessionSyncStatusCode: Int? = nil,
        sessionSyncRequestId: String? = nil,
        apiStatusCode: Int? = nil,
        apiErrorCode: String? = nil,
        apiRequestId: String? = nil,
        outcomeKind: String
    ) -> AuthPipelineQAExport {
        let snap = fieldSnapshot(email: email, password: password, mode: mode)
        let vr = validationReason ?? snap.validationReason
        return AuthPipelineQAExport(
            validationReason: vr,
            emailEmpty: snap.emailEmpty,
            emailFormatOK: snap.emailFormatOK,
            passwordEmpty: snap.passwordEmpty,
            passwordTrimmedCount: snap.passwordTrimmedCount,
            phase: phase,
            supabaseStatusCode: supabaseStatusCode,
            supabaseErrorCode: supabaseErrorCode,
            sessionSyncStatusCode: sessionSyncStatusCode,
            sessionSyncRequestId: sessionSyncRequestId,
            apiStatusCode: apiStatusCode,
            apiErrorCode: apiErrorCode,
            apiRequestId: apiRequestId,
            outcomeKind: outcomeKind
        )
    }
}

/// Sign-in / sign-up form surface only — **not** read from `AuthManager` so stale global state cannot leak into the UI.
enum AuthFormBanner: Equatable {
    case validation(String)
    case info(String)
    case auth(String)
    case connection(String)

    var message: String {
        switch self {
        case .validation(let s), .info(let s), .auth(let s), .connection(let s):
            return s
        }
    }

    /// Success-style chrome (reset sent, verify inbox from happy path).
    var usesSuccessChrome: Bool {
        if case .info = self { return true }
        return false
    }

    /// Non-secret label for QA footer / logging (e.g. `validation`, `connection`).
    var qaKind: String {
        switch self {
        case .validation: return "validation"
        case .info: return "info"
        case .auth: return "auth"
        case .connection: return "connection"
        }
    }

    /// Maps sanitized sign-in / sign-up / session-sync / password-recovery errors to a semantic banner.
    static func fromSignInFlowError(_ error: Error) -> AuthFormBanner {
        let text = PFCustomerFacingErrorCopy.sanitizeSignInFlowError(error)
        if error is URLError {
            return .connection(text)
        }
        if text == "Email or password is incorrect." {
            return .auth(text)
        }
        // Normalize curly apostrophe (common in customer-facing strings) so one branch covers "couldn't" / "couldn't".
        let lower = text.lowercased().replacingOccurrences(of: "\u{2019}", with: "'")
        if lower.contains("couldn't connect")
            || lower.contains("could not connect")
            || lower.contains("try again shortly")
            || lower.contains("check your connection")
        {
            return .connection(text)
        }
        if text.hasPrefix("Check your email to verify") {
            return .info(text)
        }
        return .auth(text)
    }
}

// MARK: - Remote auth outcomes (returned to `AuthFormView`, never written to a global banner)

enum AuthFormSignInOutcome: Equatable {
    case signedIn
    case failed(banner: AuthFormBanner, qa: AuthPipelineQAExport)
}

enum AuthFormSignUpOutcome: Equatable {
    case signedIn
    case verifyEmailInbox
    case failed(banner: AuthFormBanner, qa: AuthPipelineQAExport)
}

// MARK: - Remote failure → customer banner + QA labels (no secrets)

enum AuthRemoteFailureMapper {
    /// Maps Supabase password-grant / signup HTTP failures after local validation passed.
    static func mapSupabasePasswordGrantFailure(
        error: Error,
        email: String,
        password: String,
        mode: AuthFormMode
    ) -> (banner: AuthFormBanner, qa: AuthPipelineQAExport) {
        let (banner, outcomeKind, sbCode, sbErr) = mapSupabasePasswordGrantFailureParts(error: error)
        let qa = AuthPipelineQAExport.make(
            email: email,
            password: password,
            mode: mode,
            validationReason: "ok",
            phase: "supabase",
            supabaseStatusCode: sbCode,
            supabaseErrorCode: sbErr,
            sessionSyncStatusCode: nil,
            sessionSyncRequestId: nil,
            outcomeKind: outcomeKind
        )
        return (banner, qa)
    }

    private static func mapSupabasePasswordGrantFailureParts(error: Error) -> (
        banner: AuthFormBanner,
        outcomeKind: String,
        supabaseStatus: Int?,
        supabaseErrorCode: String?
    ) {
        if error is URLError {
            let b = AuthFormBanner.fromSignInFlowError(error)
            return (b, b.qaKind, nil, nil)
        }
        if let api = error as? APIError {
            let code = api.httpStatusCodeForQA ?? -1
            let body = api.responseBodyTextForQA
            let oauth = oauthCodeFromSupabaseJSONBody(body)
            let banner = AuthFormBanner.fromSignInFlowError(error)
            if (500 ..< 600).contains(code) || code == -1 {
                return (banner, "connection", code, oauth)
            }
            return (banner, banner.qaKind, code, oauth)
        }
        let b = AuthFormBanner.fromSignInFlowError(error)
        return (b, b.qaKind, nil, nil)
    }

    /// Maps `POST /v1/mobile/auth/*` failures (structured `{ error: { code, message } }`).
    static func mapBackendMobileAuthFailure(
        error: Error,
        email: String,
        password: String,
        mode: AuthFormMode
    ) -> (banner: AuthFormBanner, qa: AuthPipelineQAExport) {
        let (banner, outcomeKind, httpCode, errCode, rid) = mapBackendMobileAuthFailureParts(error: error)
        let qa = AuthPipelineQAExport.make(
            email: email,
            password: password,
            mode: mode,
            validationReason: "ok",
            phase: "backendAuth",
            supabaseStatusCode: nil,
            supabaseErrorCode: nil,
            sessionSyncStatusCode: nil,
            sessionSyncRequestId: nil,
            apiStatusCode: httpCode,
            apiErrorCode: errCode,
            apiRequestId: rid,
            outcomeKind: outcomeKind
        )
        return (banner, qa)
    }

    private static func mapBackendMobileAuthFailureParts(error: Error) -> (
        banner: AuthFormBanner,
        outcomeKind: String,
        httpCode: Int?,
        errCode: String?,
        requestId: String?
    ) {
        if error is URLError {
            let b = AuthFormBanner.fromSignInFlowError(error)
            return (b, "connection", nil, nil, nil)
        }
        if let api = error as? APIError {
            switch api {
            case let .structured(status, code, message, _, rid):
                let c = code?.uppercased() ?? ""
                switch c {
                case "INVALID_CREDENTIALS":
                    return (.auth("Email or password is incorrect."), "auth", status, code, rid)
                case "EMAIL_NOT_CONFIRMED":
                    return (.info("Check your email to verify your account before signing in."), "info", status, code, rid)
                case "RATE_LIMITED":
                    return (.connection("Too many attempts. Try again shortly."), "connection", status, code, rid)
                case "SESSION_SYNC_FAILED", "SIGN_OUT_FAILED":
                    return (.auth(message), "auth", status, code, rid)
                case "VALIDATION_ERROR":
                    return (.validation(message), "validation", status, code, rid)
                case "USER_ALREADY_EXISTS":
                    return (.auth(message), "auth", status, code, rid)
                default:
                    break
                }
                if (500 ..< 600).contains(status) || status == -1 {
                    let b = AuthFormBanner.fromSignInFlowError(error)
                    return (b, "connection", status, code, rid)
                }
                if status == 401 {
                    return (.auth("Email or password is incorrect."), "auth", status, code, rid)
                }
                let b = AuthFormBanner.fromSignInFlowError(error)
                return (b, b.qaKind, status, code, rid)
            default:
                let b = AuthFormBanner.fromSignInFlowError(error)
                return (b, b.qaKind, nil, nil, nil)
            }
        }
        let b = AuthFormBanner.fromSignInFlowError(error)
        return (b, b.qaKind, nil, nil, nil)
    }

    static func mapSessionSyncFailure(
        error: Error,
        email: String,
        password: String,
        mode: AuthFormMode
    ) -> (banner: AuthFormBanner, qa: AuthPipelineQAExport) {
        let (banner, outcomeKind, syncCode, rid) = mapSessionSyncFailureParts(error: error)
        let qa = AuthPipelineQAExport.make(
            email: email,
            password: password,
            mode: mode,
            validationReason: "ok",
            phase: "sessionSync",
            supabaseStatusCode: nil,
            supabaseErrorCode: nil,
            sessionSyncStatusCode: syncCode,
            sessionSyncRequestId: rid,
            outcomeKind: outcomeKind
        )
        return (banner, qa)
    }

    private static func mapSessionSyncFailureParts(error: Error) -> (
        banner: AuthFormBanner,
        outcomeKind: String,
        syncStatus: Int?,
        requestId: String?
    ) {
        if let sync = error as? AuthSessionSyncHTTPFailure {
            switch sync {
            case let .nonSuccess(code, body, rid):
                if (500 ..< 600).contains(code) || code == -1 {
                    let b = AuthFormBanner.fromSignInFlowError(APIError.status(code: code, body: body))
                    return (b, "sessionSyncServer", code, rid)
                }
                if code == 401 || code == 403 {
                    return (.auth("Could not verify your session with PulseFill. Please sign in again."), "sessionSyncAuth", code, rid)
                }
                if (400 ..< 500).contains(code) {
                    return (.auth("Could not complete sign-in. Please try again."), "sessionSyncClient", code, rid)
                }
                let b = AuthFormBanner.fromSignInFlowError(APIError.status(code: code, body: body))
                return (b, "sessionSyncOther", code, rid)
            }
        }
        if error is URLError {
            let b = AuthFormBanner.fromSignInFlowError(error)
            return (b, b.qaKind, nil, nil)
        }
        let b = AuthFormBanner.fromSignInFlowError(error)
        return (b, b.qaKind, nil, nil)
    }

    private static func oauthCodeFromSupabaseJSONBody(_ body: String?) -> String? {
        guard let body, let data = body.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        if let e = obj["error"] as? String { return e }
        if let e = obj["error_code"] as? String { return e }
        return nil
    }
}

private extension APIError {
    var httpStatusCodeForQA: Int? {
        switch self {
        case let .structured(statusCode, _, _, _, _):
            return statusCode
        case let .status(code, _):
            return code
        default:
            return nil
        }
    }

    var responseBodyTextForQA: String? {
        switch self {
        case let .status(_, body):
            return body
        case let .structured(_, _, message, _, _):
            return message
        default:
            return nil
        }
    }
}
