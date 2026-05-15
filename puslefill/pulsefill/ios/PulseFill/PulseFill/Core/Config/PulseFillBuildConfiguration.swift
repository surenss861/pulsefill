import Foundation

/// Safe, non-secret fields for the launch misconfiguration screen (TestFlight / support).
struct PulseFillClientLaunchDiagnostics: Equatable {
    let tierLabel: String
    let apiHost: String
    let supabaseHost: String
    let anonKeyStatus: String
    let safeFailureSummary: String?
    /// e.g. `1.0 (42)` from marketing version + bundle build.
    let appVersionLabel: String
    /// From Info.plist `PulseFillSourceRevision` (set per-archive / CI), else `unknown`.
    let sourceRevision: String
}

/// Deployment tier for API + Supabase defaults. Does not affect Xcode Debug vs Release by itself;
/// use `PULSEFILL_TIER` in the Run scheme (or TestFlight / CI env) to point at Railway staging.
enum PulseFillDeploymentTier: String, CaseIterable {
    /// Simulator / device → `127.0.0.1` API (see defaults below).
    case local
    /// Railway staging / internal pilot host.
    case staging
    /// Production API hostname.
    case production
}

/// **PulseFill iOS backend configuration (source of truth in Swift).**
///
/// **Precedence (highest first)**  
/// 1. Process env vars (Xcode scheme, `simctl`, CI)  
/// 2. Info.plist (`PulseFillAPIBaseURL`, `PulseFillSupabaseURL`, `PulseFillSupabaseAnonKey`, `PulseFillTier`) — substituted at build time from `PULSEFILL_*` in Release `.xcconfig` (Archive / TestFlight)  
/// 3. Tier defaults (`PULSEFILL_TIER` + `#if DEBUG`) and Swift fallbacks  
///
/// Env vars:
/// - `PULSEFILL_TIER` — `local` | `staging` | `production` (overrides Debug/Release default tier)
/// - `PULSEFILL_API_BASE_URL` — full API root, e.g. `https://xxx.up.railway.app`
/// - `PULSEFILL_SUPABASE_URL` — Supabase project URL
/// - `PULSEFILL_SUPABASE_ANON_KEY` — Supabase **publishable** / anon key for client use only.
///   Never put `sb_secret__…` or **service_role** keys in the app (server-only).
/// - `PULSEFILL_STAGING_API_URL` — optional; if set, used as **staging** default when tier is staging and `PULSEFILL_API_BASE_URL` is unset
enum PulseFillBuildConfiguration {
    /// Edit these when your Railway URLs are known (or always use env overrides).
    private enum Defaults {
        /// Replace with your Railway **staging** API public URL (no trailing slash).
        static let stagingAPI = "https://YOUR_STAGING_API.up.railway.app"
        /// Production Fastify API on Railway (no trailing slash). Not the dashboard / marketing host.
        static let productionAPI = "https://pulsefill-production.up.railway.app"
        /// Default Supabase API URL (project ref). Override with `PULSEFILL_SUPABASE_URL` in scheme if needed.
        static let supabaseProject = "https://tlowrfeburobfgpaeins.supabase.co"
        /// Replace with your **publishable** key from Supabase Dashboard → Project Settings → API (legacy “anon” JWT or `sb_publishable_…`).
        /// Do **not** paste `sb_secret__…` here — that key is for servers only.
        static let supabaseAnonPlaceholder = "YOUR_PUBLISHABLE_OR_ANON_KEY"
    }

    private static func env(_ key: String) -> String? {
        let v = ProcessInfo.processInfo.environment[key]?.trimmingCharacters(in: .whitespacesAndNewlines)
        return (v?.isEmpty == false) ? v : nil
    }

    /// Values merged from `Info.plist` (typically `$(PULSEFILL_*)` from Release xcconfig). Ignores empty strings and unsubstituted `$(VAR)` placeholders.
    private static func infoPlistString(_ key: String) -> String? {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: key) as? String else { return nil }
        let v = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !v.isEmpty else { return nil }
        if v.hasPrefix("$(") {
            return nil
        }
        return v
    }

    /// Ensures `PULSEFILL_API_BASE_URL` is usable with `URL(relativeTo:)`: adds `https://` when the host
    /// was given without a scheme (a common Xcode scheme mistake that yields NSURLError -1002 / relative `/v1/...` URLs).
    static func normalizedAPIBaseURLString(_ raw: String) -> String {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        while s.hasSuffix("/") { s.removeLast() }
        guard !s.isEmpty else { return s }
        if s.range(of: "^[a-zA-Z][a-zA-Z0-9+.-]*://", options: .regularExpression) != nil {
            return s
        }
        if s.hasPrefix("//") {
            return "https:\(s)"
        }
        return "https://\(s)"
    }

    /// Active tier: explicit `PULSEFILL_TIER`, else Debug → **simulator** uses local API, **device** uses production (Railway).
    /// Release builds always use production unless `PULSEFILL_TIER` / `PULSEFILL_API_BASE_URL` overrides.
    static var deploymentTier: PulseFillDeploymentTier {
        if let raw = env("PULSEFILL_TIER")?.lowercased(),
           let tier = PulseFillDeploymentTier(rawValue: raw)
        {
            return tier
        }
        if let raw = infoPlistString("PulseFillTier")?.lowercased(),
           let tier = PulseFillDeploymentTier(rawValue: raw)
        {
            return tier
        }
        #if DEBUG
        #if targetEnvironment(simulator)
        return .local
        #else
        // Physical iPhone: `127.0.0.1` is the phone itself — use deployed API unless scheme sets `PULSEFILL_TIER=local`.
        return .production
        #endif
        #else
        return .production
        #endif
    }

    /// Fastify `v1` API base URL (no trailing slash).
    static var apiBaseURL: URL {
        if let s = env("PULSEFILL_API_BASE_URL") {
            let normalized = normalizedAPIBaseURLString(s)
            if let url = URL(string: normalized) {
                return url
            }
        }
        if let s = infoPlistString("PulseFillAPIBaseURL") {
            let normalized = normalizedAPIBaseURLString(s)
            if let url = URL(string: normalized) {
                return url
            }
        }
        switch deploymentTier {
        case .local:
            return URL(string: "http://127.0.0.1:3001")!
        case .staging:
            if let s = env("PULSEFILL_STAGING_API_URL"), let url = URL(string: s) {
                return url
            }
            return URL(string: Defaults.stagingAPI)!
        case .production:
            return URL(string: Defaults.productionAPI)!
        }
    }

    /// Supabase project URL (no trailing slash).
    static var supabaseURL: URL {
        if let s = env("PULSEFILL_SUPABASE_URL"), let url = URL(string: s) {
            return url
        }
        if let s = infoPlistString("PulseFillSupabaseURL"), let url = URL(string: s) {
            return url
        }
        return URL(string: Defaults.supabaseProject)!
    }

    /// Supabase **anon** key (safe to ship in the client; replace placeholder before App Store).
    static var supabaseAnonKey: String {
        if let s = env("PULSEFILL_SUPABASE_ANON_KEY") {
            return s
        }
        if let s = infoPlistString("PulseFillSupabaseAnonKey") {
            return s
        }
        return Defaults.supabaseAnonPlaceholder
    }

    #if DEBUG
    /// Logs resolved URLs and tier at startup. Never prints the anon key — only placeholder / length / source.
    static func debugLogResolvedConfigurationIfNeeded() {
        if ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1" { return }

        let rawEnv = ProcessInfo.processInfo.environment
        func envNonEmpty(_ key: String) -> Bool {
            let v = rawEnv[key]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return !v.isEmpty
        }

        let sup = supabaseURL
        let api = apiBaseURL
        let tier = deploymentTier
        let key = supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        let anonFromScheme = envNonEmpty("PULSEFILL_SUPABASE_ANON_KEY")
        let apiFromPlist = infoPlistString("PulseFillAPIBaseURL") != nil
        let supFromPlist = infoPlistString("PulseFillSupabaseURL") != nil
        let tierFromPlist = infoPlistString("PulseFillTier") != nil
        let anonFromPlist = infoPlistString("PulseFillSupabaseAnonKey") != nil

        let anonSummary: String
        if key.isEmpty {
            anonSummary = "empty"
        } else if key == Defaults.supabaseAnonPlaceholder || key.localizedCaseInsensitiveContains("YOUR_PUBLISHABLE")
            || key.localizedCaseInsensitiveContains("YOUR_ANON")
        {
            anonSummary = "PLACEHOLDER — set PULSEFILL_SUPABASE_ANON_KEY in Run scheme"
        } else if key.lowercased().hasPrefix("sb_secret_") {
            anonSummary = "invalid (sb_secret_ — use publishable/anon only)"
        } else if key.localizedCaseInsensitiveContains("service_role") {
            anonSummary = "invalid (string mentions service_role)"
        } else if key.hasPrefix("eyJ"), jwtPayloadContainsServiceRole(key) {
            anonSummary = "invalid (JWT role is service_role)"
        } else {
            let src: String
            if anonFromScheme {
                src = "scheme env"
            } else if anonFromPlist {
                src = "Info.plist"
            } else {
                src = "compiled default"
            }
            anonSummary = "set (\(key.count) chars, source: \(src))"
        }

        let host = (sup.host ?? "").lowercased()
        let looksLikeSupabase = host.hasSuffix(".supabase.co")

        print("PulseFill DEBUG config — tier=\(tier.rawValue)")
        print("PulseFill DEBUG config — env set: PULSEFILL_SUPABASE_URL=\(envNonEmpty("PULSEFILL_SUPABASE_URL")) PULSEFILL_SUPABASE_ANON_KEY=\(envNonEmpty("PULSEFILL_SUPABASE_ANON_KEY")) PULSEFILL_API_BASE_URL=\(envNonEmpty("PULSEFILL_API_BASE_URL")) PULSEFILL_TIER=\(envNonEmpty("PULSEFILL_TIER"))")
        print("PulseFill DEBUG config — Info.plist keys present: PulseFillAPIBaseURL=\(apiFromPlist) PulseFillSupabaseURL=\(supFromPlist) PulseFillTier=\(tierFromPlist) PulseFillSupabaseAnonKey=\(anonFromPlist)")
        print("PulseFill DEBUG config — supabaseURL=\(sup.absoluteString)")
        if !looksLikeSupabase {
            print("PulseFill DEBUG config — WARNING: host is not *.supabase.co. Auth calls go to \(sup.absoluteString)/auth/v1/... — a Next.js/marketing host returns HTML 404; use Project Settings → API → Project URL.")
        }
        print("PulseFill DEBUG config — apiBaseURL=\(api.absoluteString)")
        print("PulseFill DEBUG config — supabaseAnonKey: \(anonSummary)")
    }
    #endif

    // MARK: - Launch validation (customer-safe; details DEBUG-only)

    struct LaunchConfigurationResult: Equatable {
        /// When set, the app should block the main shell and only show this copy (never raw reasons).
        let blockingCustomerMessage: String?
        /// Technical summary for `#if DEBUG` logging only.
        let debugSummary: String?
        /// Same technical reasons as `debugSummary`, safe to show on the blocking screen (no secrets).
        let safeFailureSummary: String?
    }

    /// Validates URLs and keys **before** networking so misbuilt TestFlight/local builds don’t leak Supabase hints in auth errors.
    static func evaluateLaunchConfiguration(
        apiBaseURL: URL,
        supabaseURL: URL,
        supabaseAnonKey: String,
        deploymentTier: PulseFillDeploymentTier = deploymentTier
    ) -> LaunchConfigurationResult {
        #if DEBUG
        if ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1" {
            return LaunchConfigurationResult(blockingCustomerMessage: nil, debugSummary: nil, safeFailureSummary: nil)
        }
        #endif

        var reasons: [String] = []

        let key = supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        if key.isEmpty {
            reasons.append("Supabase anon key is empty.")
        } else if key == Defaults.supabaseAnonPlaceholder || key.localizedCaseInsensitiveContains("YOUR_PUBLISHABLE")
            || key.localizedCaseInsensitiveContains("YOUR_ANON")
        {
            reasons.append("Supabase anon key is still the placeholder.")
        } else if key.lowercased().hasPrefix("sb_secret_") {
            reasons.append("Supabase key looks like a secret (sb_secret_) — never ship in the app.")
        } else if key.localizedCaseInsensitiveContains("service_role") {
            reasons.append("Supabase key string mentions service_role.")
        } else if key.hasPrefix("eyJ") {
            if jwtPayloadContainsServiceRole(key) {
                reasons.append("JWT role is service_role (use anon/publishable key only).")
            }
        } else if key.lowercased().hasPrefix("sb_publishable_") {
            if key.count < 16 {
                reasons.append("Supabase publishable key looks truncated.")
            }
        } else if key.count < 32 {
            reasons.append("Supabase key format unrecognized (too short).")
        }

        if supabaseURL.scheme?.lowercased() != "https" {
            reasons.append("Supabase URL must use https.")
        }
        if (supabaseURL.host ?? "").isEmpty {
            reasons.append("Supabase URL has no host.")
        }

        let apiScheme = apiBaseURL.scheme?.lowercased() ?? ""
        if deploymentTier != .local, apiScheme != "https" {
            reasons.append("API base URL must use https in non-local tiers.")
        }
        if (apiBaseURL.host ?? "").isEmpty {
            reasons.append("API base URL has no host — check PULSEFILL_API_BASE_URL (include https://).")
        }

        switch deploymentTier {
        case .staging:
            let api = apiBaseURL.absoluteString
            if api.localizedCaseInsensitiveContains("YOUR_STAGING") || api.localizedCaseInsensitiveContains("YOUR_") {
                reasons.append("Staging API URL is still a placeholder.")
            }
        case .local, .production:
            break
        }

        guard reasons.isEmpty else {
            let summary = reasons.joined(separator: " ")
            return LaunchConfigurationResult(
                blockingCustomerMessage: "We couldn’t connect to PulseFill. Please try again shortly.",
                debugSummary: summary,
                safeFailureSummary: summary
            )
        }
        return LaunchConfigurationResult(blockingCustomerMessage: nil, debugSummary: nil, safeFailureSummary: nil)
    }

    /// Builds non-secret diagnostics for the misconfigured-client blocking UI.
    static func clientLaunchDiagnostics(
        apiBaseURL: URL,
        supabaseURL: URL,
        supabaseAnonKey: String,
        deploymentTier: PulseFillDeploymentTier,
        safeFailureSummary: String?
    ) -> PulseFillClientLaunchDiagnostics {
        let key = supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        let anonStatus: String
        if key.isEmpty {
            anonStatus = "missing"
        } else if key == Defaults.supabaseAnonPlaceholder || key.localizedCaseInsensitiveContains("YOUR_PUBLISHABLE")
            || key.localizedCaseInsensitiveContains("YOUR_ANON")
        {
            anonStatus = "placeholder"
        } else {
            anonStatus = "present"
        }
        return PulseFillClientLaunchDiagnostics(
            tierLabel: deploymentTier.rawValue,
            apiHost: apiBaseURL.host ?? "—",
            supabaseHost: supabaseURL.host ?? "—",
            anonKeyStatus: anonStatus,
            safeFailureSummary: safeFailureSummary,
            appVersionLabel: appVersionLabelFromBundle(),
            sourceRevision: resolvedSourceRevisionFromBundle(),
        )
    }

    /// Non-secret one-liner for Sign in / Create account (TestFlight build verification).
    static var authScreenQAFootnote: String {
        let marketing = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
        let rev = resolvedSourceRevisionFromBundle()
        let tier = deploymentTier.rawValue
        let api = apiBaseURL.host ?? "—"
        let sb = supabaseURL.host ?? "—"
        return "Build \(marketing) (\(build)) · \(rev) · \(tier) · API \(api) · Supabase \(sb)"
    }

    /// Release-safe auth submit breadcrumbs (`Logger` / Console). Set `PulseFillAuthQaLogs` via `PULSEFILL_AUTH_QA_LOGS` in Release xcconfig (YES/NO).
    static var isAuthQaLoggingEnabled: Bool {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "PulseFillAuthQaLogs") as? String else { return false }
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if t.isEmpty || t.hasPrefix("$(") {
            return false
        }
        return t == "yes" || t == "true" || t == "1"
    }

    private static func appVersionLabelFromBundle() -> String {
        let marketing = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
        return "\(marketing) (\(build))"
    }

    private static func resolvedSourceRevisionFromBundle() -> String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "PulseFillSourceRevision") as? String else {
            return "unknown"
        }
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if t.isEmpty || t.hasPrefix("$(") {
            return "unknown"
        }
        return t
    }

    /// One line for operator-facing Account / debug (tier + marketing version + build).
    static var operatorClientBuildLine: String {
        let marketing = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
        return "\(deploymentTier.rawValue) · \(marketing) (\(build))"
    }

    private static func jwtPayloadContainsServiceRole(_ jwt: String) -> Bool {
        let parts = jwt.split(separator: ".")
        guard parts.count >= 2 else { return false }
        var b64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let pad = (4 - b64.count % 4) % 4
        if pad > 0 { b64 += String(repeating: "=", count: pad) }
        guard let data = Data(base64Encoded: b64),
              let json = String(data: data, encoding: .utf8)?.lowercased()
        else { return false }
        return json.contains("\"role\":\"service_role\"") || json.contains("\"role\": \"service_role\"")
    }
}
