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
        #expect(out == .failed(.validation("Enter your password.")))
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
        #expect(out == .failed(.validation("Enter a valid email address.")))
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
        #expect(out == .failed(.validation("Enter your password.")))
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
