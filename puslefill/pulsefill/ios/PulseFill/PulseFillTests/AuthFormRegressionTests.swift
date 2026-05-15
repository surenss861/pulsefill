//
//  AuthFormRegressionTests.swift
//  PulseFillTests
//

import Foundation
import Testing
@testable import PulseFill

// MARK: - Spy (proves Supabase password grant is not invoked when inputs are invalid)

final class SpyPasswordAuthClient: PulseFillPasswordAuthClient, @unchecked Sendable {
    private let lock = NSLock()
    private var _signIn = 0
    private var _signUp = 0
    private var _recover = 0

    var signInCallCount: Int {
        lock.lock()
        defer { lock.unlock() }
        return _signIn
    }

    var signUpCallCount: Int {
        lock.lock()
        defer { lock.unlock() }
        return _signUp
    }

    var recoverCallCount: Int {
        lock.lock()
        defer { lock.unlock() }
        return _recover
    }

    func signInWithPassword(email: String, password: String) async throws -> AuthSessionBundle {
        lock.lock()
        _signIn += 1
        lock.unlock()
        Issue.record("signInWithPassword should not run in this test scenario")
        throw URLError(.badURL)
    }

    func signUpWithPassword(email: String, password: String) async throws -> AuthSessionBundle? {
        lock.lock()
        _signUp += 1
        lock.unlock()
        Issue.record("signUpWithPassword should not run in this test scenario")
        throw URLError(.badURL)
    }

    func requestPasswordRecovery(email: String) async throws {
        lock.lock()
        _recover += 1
        lock.unlock()
        Issue.record("requestPasswordRecovery should not run in this test scenario")
        throw URLError(.badURL)
    }

    func fetchUserIfSessionValid(accessToken: String) async throws -> AuthSessionBundle {
        throw URLError(.badURL)
    }

    func refreshSession(refreshToken: String) async throws -> AuthSessionBundle {
        throw URLError(.badURL)
    }
}

/// Returns a Supabase-shaped session bundle (used when testing Railway session sync failures).
final class SuccessfulSignInPasswordAuthClient: PulseFillPasswordAuthClient, @unchecked Sendable {
    func signInWithPassword(email: String, password: String) async throws -> AuthSessionBundle {
        AuthSessionBundle(accessToken: "test_access", refreshToken: "test_refresh", userId: "user_test", email: email)
    }

    func signUpWithPassword(email: String, password: String) async throws -> AuthSessionBundle? {
        nil
    }

    func requestPasswordRecovery(email: String) async throws {}

    func fetchUserIfSessionValid(accessToken: String) async throws -> AuthSessionBundle {
        throw URLError(.badURL)
    }

    func refreshSession(refreshToken: String) async throws -> AuthSessionBundle {
        throw URLError(.badURL)
    }
}

final class MockURLProtocol: URLProtocol {
    nonisolated(unsafe) static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            client?.urlProtocol(self, didFailWithError: URLError(.badURL))
            return
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

struct AuthFormValidationRegressionTests {
    @Test func emptyEmail_signIn_blocks() {
        let r = AuthFormValidation.submitValidation(email: "", password: "secret12", mode: .signIn)
        guard case .failure(let banner, let q) = r else {
            Issue.record("expected failure")
            return
        }
        #expect(q == "empty_email")
        #expect(banner == .validation("Enter your email."))
    }

    @Test func invalidEmail_signIn_blocks() {
        let r = AuthFormValidation.submitValidation(email: "not-an-email", password: "secret12", mode: .signIn)
        guard case .failure(let banner, let q) = r else {
            Issue.record("expected failure")
            return
        }
        #expect(q == "invalid_email")
        #expect(banner == .validation("Enter a valid email address."))
    }

    @Test func emptyPassword_signIn_blocks() {
        let r = AuthFormValidation.submitValidation(email: "a@b.com", password: "", mode: .signIn)
        guard case .failure(let banner, let q) = r else {
            Issue.record("expected failure")
            return
        }
        #expect(q == "empty_password")
        #expect(banner == .validation("Enter your password."))
    }

    @Test func shortPassword_signUp_blocks() {
        let r = AuthFormValidation.submitValidation(email: "a@b.com", password: "12345", mode: .signUp)
        guard case .failure(let banner, let q) = r else {
            Issue.record("expected failure")
            return
        }
        #expect(q == "password_short")
        #expect(banner == .validation("Use a password with at least 6 characters."))
    }
}

@MainActor
struct AuthManagerPipelineRegressionTests {
    @Test func performSignIn_emptyPassword_doesNotCallSupabase() async {
        let spy = SpyPasswordAuthClient()
        let sessionStore = SessionStore()
        let api = APIClient(baseURL: URL(string: "https://example.invalid")!, sessionStore: sessionStore)
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        let push = PushRegistrationManager(apiClient: api)
        let mgr = AuthManager(
            authClient: spy,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: push,
            userRoleContext: userRoleContext
        )
        let out = await mgr.performSignIn(email: "a@b.com", password: "")
        guard case let .failed(banner, qa) = out else {
            Issue.record("expected failed")
            return
        }
        #expect(banner == .validation("Enter your password."))
        #expect(qa.validationReason == "empty_password")
        #expect(qa.phase == "localValidation")
        #expect(qa.passwordEmpty == true)
        #expect(spy.signInCallCount == 0)
        #expect(spy.signUpCallCount == 0)
    }

    @Test func performSignIn_invalidEmail_doesNotCallSupabase() async {
        let spy = SpyPasswordAuthClient()
        let sessionStore = SessionStore()
        let api = APIClient(baseURL: URL(string: "https://example.invalid")!, sessionStore: sessionStore)
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        let push = PushRegistrationManager(apiClient: api)
        let mgr = AuthManager(
            authClient: spy,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: push,
            userRoleContext: userRoleContext
        )
        let out = await mgr.performSignIn(email: "bad", password: "secret12")
        guard case let .failed(banner, qa) = out else {
            Issue.record("expected failed")
            return
        }
        #expect(banner == .validation("Enter a valid email address."))
        #expect(qa.validationReason == "invalid_email")
        #expect(spy.signInCallCount == 0)
    }

    @Test func performSignUp_whitespacePassword_doesNotCallSupabase() async {
        let spy = SpyPasswordAuthClient()
        let sessionStore = SessionStore()
        let api = APIClient(baseURL: URL(string: "https://example.invalid")!, sessionStore: sessionStore)
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        let push = PushRegistrationManager(apiClient: api)
        let mgr = AuthManager(
            authClient: spy,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: push,
            userRoleContext: userRoleContext
        )
        let out = await mgr.performSignUp(email: "a@b.com", password: "   ")
        guard case let .failed(banner, qa) = out else {
            Issue.record("expected failed")
            return
        }
        #expect(banner == .validation("Enter your password."))
        #expect(qa.passwordEmpty == true)
        #expect(spy.signUpCallCount == 0)
    }
}

struct AuthFormBannerMappingTests {
    @Test func wrongPassword_mapsToAuth() {
        let err = APIError.status(code: 400, body: #"{"error":"invalid_grant","error_description":"Invalid login credentials"}"#)
        let banner = AuthFormBanner.fromSignInFlowError(err)
        if case .auth(let msg) = banner {
            #expect(msg == "Email or password is incorrect.")
        } else {
            Issue.record("expected .auth, got \(banner)")
        }
    }

    @Test func urlError_mapsToConnection() {
        let err = URLError(.notConnectedToInternet)
        let banner = AuthFormBanner.fromSignInFlowError(err)
        if case .connection(let msg) = banner {
            #expect(msg.contains("couldn"))
        } else {
            Issue.record("expected .connection, got \(banner)")
        }
    }
}

struct SupabaseAuthClientValidationRegressionTests {
    private var client: SupabaseAuthClient {
        SupabaseAuthClient(
            supabaseURL: URL(string: "https://unit-test.supabase.co")!,
            anonKey: "anon"
        )
    }

    @Test func signIn_emptyPassword_throwsBeforeAwaitingNetwork() async {
        do {
            _ = try await client.signInWithPassword(email: "a@b.com", password: "")
            Issue.record("expected throw")
        } catch let e as SupabaseAuthClientValidationError {
            #expect(e == .emptyPassword)
        } catch {
            Issue.record("wrong error: \(error)")
        }
    }

    @Test func signIn_invalidEmail_throws() async {
        do {
            _ = try await client.signInWithPassword(email: "nope", password: "secret12")
            Issue.record("expected throw")
        } catch let e as SupabaseAuthClientValidationError {
            #expect(e == .invalidEmail)
        } catch {
            Issue.record("wrong error: \(error)")
        }
    }

    @Test func signUp_shortPassword_throws() async {
        do {
            _ = try await client.signUpWithPassword(email: "a@b.com", password: "12345")
            Issue.record("expected throw")
        } catch let e as SupabaseAuthClientValidationError {
            #expect(e == .passwordTooShortForSignUp)
        } catch {
            Issue.record("wrong error: \(error)")
        }
    }

    @Test func recover_emptyEmail_throws() async {
        do {
            try await client.requestPasswordRecovery(email: "")
            Issue.record("expected throw")
        } catch let e as SupabaseAuthClientValidationError {
            #expect(e == .emptyEmail)
        } catch {
            Issue.record("wrong error: \(error)")
        }
    }
}

@MainActor
struct AuthManagerPasswordResetRegressionTests {
    @Test func performPasswordReset_invalidEmail_doesNotCallRecover() async {
        let spy = SpyPasswordAuthClient()
        let sessionStore = SessionStore()
        let api = APIClient(baseURL: URL(string: "https://example.invalid")!, sessionStore: sessionStore)
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        let push = PushRegistrationManager(apiClient: api)
        let mgr = AuthManager(
            authClient: spy,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: push,
            userRoleContext: userRoleContext
        )
        let banner = await mgr.performPasswordReset(email: "not-email")
        #expect(banner == .validation("Enter a valid email address."))
        #expect(spy.recoverCallCount == 0)
    }

    @Test func performPasswordReset_emptyEmail_doesNotCallRecover() async {
        let spy = SpyPasswordAuthClient()
        let sessionStore = SessionStore()
        let api = APIClient(baseURL: URL(string: "https://example.invalid")!, sessionStore: sessionStore)
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        let push = PushRegistrationManager(apiClient: api)
        let mgr = AuthManager(
            authClient: spy,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: push,
            userRoleContext: userRoleContext
        )
        let banner = await mgr.performPasswordReset(email: "   ")
        #expect(banner == .validation("Enter your email."))
        #expect(spy.recoverCallCount == 0)
    }
}

struct AuthPipelineQAExportRegressionTests {
    @Test func passwordQaRow_reportsEmptyPassword() {
        let hint = AuthPipelineQAExport.passwordQaRow(email: "a@b.com", password: "", mode: .signIn)
        #expect(hint == "pwEmpty=true · pwLen=0")
    }
}

struct AuthRemoteFailureMapperRegressionTests {
    @Test func mapSessionSync_401_usesSessionSyncAuthOutcome() {
        let err = AuthSessionSyncHTTPFailure.nonSuccess(statusCode: 401, body: nil, requestId: "rid-401")
        let (_, qa) = AuthRemoteFailureMapper.mapSessionSyncFailure(
            error: err,
            email: "a@b.com",
            password: "pw",
            mode: .signIn
        )
        #expect(qa.sessionSyncStatusCode == 401)
        #expect(qa.sessionSyncRequestId == "rid-401")
        #expect(qa.outcomeKind == "sessionSyncAuth")
        #expect(qa.phase == "sessionSync")
    }

    @Test func mapSupabase_invalid_grant_recordsStatusAndOAuthCode() {
        let err = APIError.status(code: 400, body: #"{"error":"invalid_grant","error_description":"Invalid login credentials"}"#)
        let (_, qa) = AuthRemoteFailureMapper.mapSupabasePasswordGrantFailure(
            error: err,
            email: "a@b.com",
            password: "pw",
            mode: .signIn
        )
        #expect(qa.supabaseStatusCode == 400)
        #expect(qa.supabaseErrorCode == "invalid_grant")
        #expect(qa.outcomeKind == "auth")
    }
}

struct AuthFormRemoteApplyPolicyRegressionTests {
    @Test func rejectsWhenPasswordNoLongerMatchesSubmission() {
        #expect(
            AuthFormRemoteApplyPolicy.shouldApplyRemoteAuthResult(
                generation: 2,
                currentGeneration: 2,
                submittedMode: .signIn,
                currentMode: .signIn,
                submittedEmail: "a@b.com",
                currentEmailRaw: "a@b.com",
                submittedPassword: "secret12",
                currentPasswordRaw: ""
            ) == false
        )
    }

    @Test func rejectsWhenGenerationChanged() {
        #expect(
            AuthFormRemoteApplyPolicy.shouldApplyRemoteAuthResult(
                generation: 1,
                currentGeneration: 2,
                submittedMode: .signIn,
                currentMode: .signIn,
                submittedEmail: "a@b.com",
                currentEmailRaw: "a@b.com",
                submittedPassword: "x",
                currentPasswordRaw: "x"
            ) == false
        )
    }
}

@MainActor
struct AuthManagerSessionSyncFailureRegressionTests {
    @Test func performSignIn_sessionSync500_clearsSessionStore() async {
        MockURLProtocol.requestHandler = { request in
            guard let url = request.url, url.path.contains("auth/session/sync") else {
                Issue.record("unexpected URL \(String(describing: request.url))")
                let u = request.url ?? URL(string: "https://placeholder")!
                return (HTTPURLResponse(url: u, statusCode: 404, httpVersion: nil, headerFields: nil)!, Data())
            }
            let res = HTTPURLResponse(
                url: url,
                statusCode: 500,
                httpVersion: nil,
                headerFields: ["X-Request-Id": "sync-rid-99"]
            )!
            return (res, Data("{}".utf8))
        }
        defer { MockURLProtocol.requestHandler = nil }

        let cfg = URLSessionConfiguration.ephemeral
        cfg.protocolClasses = [MockURLProtocol.self] + (cfg.protocolClasses ?? [])
        let urlSession = URLSession(configuration: cfg)

        let sessionStore = SessionStore()
        let api = APIClient(baseURL: URL(string: "https://api.test")!, sessionStore: sessionStore, urlSession: urlSession)
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        let push = PushRegistrationManager(apiClient: api)
        let mgr = AuthManager(
            authClient: SuccessfulSignInPasswordAuthClient(),
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: push,
            userRoleContext: userRoleContext
        )

        let out = await mgr.performSignIn(email: "a@b.com", password: "secret12")
        #expect(sessionStore.isSignedIn == false)

        guard case let .failed(_, qa) = out else {
            Issue.record("expected failed outcome")
            return
        }
        #expect(qa.phase == "sessionSync")
        #expect(qa.sessionSyncStatusCode == 500)
        #expect(qa.sessionSyncRequestId == "sync-rid-99")
        #expect(qa.outcomeKind == "sessionSyncServer")
    }
}
