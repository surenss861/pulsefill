import SwiftUI

struct AvailabilitySelectionView: View {
    @Binding var draft: StandbyPreferenceDraft

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            PFTypography.section("When could you actually make it?")
            PFTypography.caption("Pick the days and usual hours that work. We’ll only offer openings that fit this window.")

            DayOfWeekPillSelector(selectedDays: $draft.daysOfWeek)

            TimeWindowCard(earliest: $draft.earliestTime, latest: $draft.latestTime)
        }
    }
}
