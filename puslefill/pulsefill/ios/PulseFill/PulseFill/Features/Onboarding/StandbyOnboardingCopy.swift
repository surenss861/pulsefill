import Foundation

enum StandbyOnboardingCopy {
    enum Intro {
        static let headline = "Get notified when better openings show up"
        static let subhead =
            "Tell us the kinds of appointments you’d take, and PulseFill will watch for matching openings for you."

        static let bullet1Title = "Pick what works for you"
        static let bullet1Body = "Choose the clinics, services, timing, and notice you’re comfortable with."

        static let bullet2Title = "Get alerted fast"
        static let bullet2Body = "When an opening matches your setup, you’ll hear about it right away."

        static let bullet3Title = "Claim before it disappears"
        static let bullet3Body = "Good openings can move quickly, so standby works best when you’re ready to act."

        static let primaryCTA = "Set up standby"
        static let secondaryCTA = "Maybe later"
        static let footer = "You can change your standby preferences anytime."
    }

    enum Push {
        static let headline = "Push helps you catch openings in time"
        static let subhead =
            "Some openings only stay available for a short window. Notifications make it easier to see them before they’re gone."

        static let benefit1 = "See new openings sooner"
        static let benefit2 = "Claim faster when timing matters"
        static let benefit3 = "Stay in control of your settings later"

        static let primaryCTA = "Turn on notifications"
        static let secondaryCTA = "Not now"

        static let deniedHeadline = "Notifications are currently off"
        static let deniedBody =
            "You can still use standby, but it may be easier to miss time-sensitive openings."
        static let deniedCTA = "Open Settings"

        static let footer = "You’ll still be able to adjust notification settings later."
    }

    enum Preference {
        static let heading = "Create your first standby preference"
        static let intro = "Start with one setup that feels useful to you. You can always add more later."

        static let businessHelper = "Choose the kinds of openings you’d actually want to take."
        static let availabilityHelper = "A broader window usually means more chances to match."
        static let noticeHelper = "Short notice can work well, but it may reduce how many openings you see."

        static let saveCTA = "Save standby preference"
        static let saveChangesCTA = "Save changes"

        static let successTitle = "You’re on standby"
        static let successBody =
            "We’ll look for openings that match this preference and let you know when one comes up."
        static let successPrimaryCTA = "Continue"
        static let successSecondaryCTA = "Add another preference"
    }

    enum Complete {
        static let headline = "Your standby is active"
        static let subhead =
            "You’re set up to receive matching openings based on the preference you just created."

        static let bullet1 = "Check your standby status anytime"
        static let bullet2 = "Review notification readiness"
        static let bullet3 = "Update your setup whenever your schedule changes"

        static let primaryCTA = "View standby status"
        static let secondaryCTA = "Done"

        static let footer =
            "You can manage preferences, notifications, and recent activity anytime from the app."

        static let recapTitle = "You’re ready"
        static let standbyLabel = "Standby preferences"
        static let notificationsLabel = "Notifications"
        static let notificationsOn = "On"
        static let notificationsOff = "Off"

        static let reassuranceWhenPushOff =
            "You can still use standby, but turning on notifications can help you catch short-notice openings faster."
    }

    enum Progress {
        static let step1 = "How it works"
        static let step2 = "Stay ready"
        static let step3 = "Your first setup"
        static let step4 = "You’re live"
    }
}
