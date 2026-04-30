import Foundation

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
/// 2. Tier defaults (`PULSEFILL_TIER` + `#if DEBUG`)  
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

    /// Active tier: explicit `PULSEFILL_TIER`, else Debug → **simulator** uses local API, **device** uses production (Railway).
    /// Release builds always use production unless `PULSEFILL_TIER` / `PULSEFILL_API_BASE_URL` overrides.
    static var deploymentTier: PulseFillDeploymentTier {
        if let raw = env("PULSEFILL_TIER")?.lowercased(),
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
        if let s = env("PULSEFILL_API_BASE_URL"), let url = URL(string: s) {
            return url
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
        return URL(string: Defaults.supabaseProject)!
    }

    /// Supabase **anon** key (safe to ship in the client; replace placeholder before App Store).
    static var supabaseAnonKey: String {
        if let s = env("PULSEFILL_SUPABASE_ANON_KEY") {
            return s
        }
        return Defaults.supabaseAnonPlaceholder
    }
}
