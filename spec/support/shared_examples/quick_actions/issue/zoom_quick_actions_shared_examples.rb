# frozen_string_literal: true

shared_examples 'zoom quick actions' do
  let(:zoom_link) { 'https://zoom.us/j/123456789' }
  let(:existing_zoom_link) { 'https://zoom.us/j/123456780' }
  let(:invalid_zoom_link) { 'https://invalid-zoom' }

  describe '/zoom' do
    shared_examples 'skip silently' do
      it 'skips addition silently' do
        add_note("/zoom #{zoom_link}")

        wait_for_requests

        expect(page).not_to have_content('Zoom meeting added')
        expect(page).not_to have_content('Failed to add a Zoom meeting')
        expect(issue.reload.zoom_meetings[0].url).not_to eq(zoom_link)
      end
    end

    shared_examples 'success' do

      it 'adds a Zoom link' do
        add_note("/zoom #{zoom_link}")

        wait_for_requests

        expect(page).to have_content('Zoom meeting added')
        expect(issue.reload.zoom_meetings[0].url).to eq(zoom_link)
      end
    end

    context 'without zoom_meetings' do

      include_examples 'success'

      it 'cannot add invalid zoom link' do
        add_note("/zoom #{invalid_zoom_link}")

        wait_for_requests

        expect(page).to have_content('Failed to add a Zoom meeting')
        expect(page).not_to have_content(zoom_link)
      end
    end

    context 'with "removed" zoom meeting' do
      before do
        create(:zoom_meeting, issue_status: :removed, url: existing_zoom_link, issue: issue)
      end

      include_examples 'success'
    end

    context 'with "added" zoom meeting' do
      before do
        create(:zoom_meeting, issue_status: :added, url: existing_zoom_link, issue: issue)
      end

      include_examples 'skip silently'
    end
  end

  describe '/remove_zoom' do
    shared_examples 'skip silently' do
      it 'skips removal silently' do
        add_note('/remove_zoom')

        wait_for_requests

        expect(page).not_to have_content('Zoom meeting removed')
        expect(page).not_to have_content('Failed to remove a Zoom meeting')
        expect(issue.reload.zoom_meetings.filter { |z| z.issue_status == ZoomMeeting.issue_statuses[:added] }).to be_empty
      end
    end

    context 'with added zoom meeting' do
      let!(:added_zoom_meeting) { create(:zoom_meeting, url: zoom_link, issue: issue, issue_status: :added) }

      it 'removes last Zoom link' do
        add_note('/remove_zoom')

        wait_for_requests

        expect(page).to have_content('Zoom meeting removed')
        expect(issue.reload.zoom_meetings.filter { |z| z.issue_status == ZoomMeeting.issue_statuses[:added] }).to be_empty
      end
    end
  end
end
