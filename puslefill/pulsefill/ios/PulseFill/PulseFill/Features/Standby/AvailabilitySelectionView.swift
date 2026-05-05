import SwiftUI

struct AvailabilitySelectionView: View {
    @Binding var draft: StandbyPreferenceDraft

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("When are you available?")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Choose the days and times that usually work for you. We’ll only show openings that fit this window.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                DayOfWeekPillSelector(selectedDays: $draft.daysOfWeek)

                if draft.isBasicSetupComplete, draft.daysOfWeek.isEmpty {
                    PFCustomerInfoCallout(
                        title: "Pick at least one day",
                        message: "Choose at least one day so PulseFill knows when to show matching openings.",
                        variant: .warning
                    )
                }

                if !draft.daysOfWeek.isEmpty, !draft.isTimeWindowValid {
                    PFCustomerInfoCallout(
                        title: "Check your times",
                        message: StandbySetupCustomerCopy.validationTimeOrder,
                        variant: .warning
                    )
                }

                TimeWindowCard(earliest: $draft.earliestTime, latest: $draft.latestTime)
            }
        }
    }
}
