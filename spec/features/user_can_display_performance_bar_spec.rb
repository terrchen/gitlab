# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'User can display performance bar', :js do
  shared_examples 'performance bar cannot be displayed' do
    it 'does not show the performance bar by default' do
      expect(page).not_to have_css('#js-peek')
    end

    context 'when user press `pb`' do
      before do
        find('body').native.send_keys('pb')
      end

      it 'does not show the performance bar by default' do
        expect(page).not_to have_css('#js-peek')
      end
    end
  end

  shared_examples 'performance bar can be displayed' do
    it 'does not show the performance bar by default' do
      expect(page).not_to have_css('#js-peek')
    end

    context 'when user press `pb`' do
      before do
        find('body').native.send_keys('pb')
      end

      it 'shows the performance bar' do
        expect(page).to have_css('#js-peek')
      end
    end
  end

  shared_examples 'performance bar is enabled by default in development' do
    before do
      stub_rails_env('development')
    end

    it 'shows the performance bar by default' do
      refresh # Because we're stubbing Rails.env after the 1st visit to root_path

      expect(page).to have_css('#js-peek')
    end
  end

  let(:group) { create(:group) }

  before do
    allow(GitlabPerformanceBarStatsWorker).to receive(:perform_in)
  end

  context 'when user is logged-out' do
    before do
      visit root_path
    end

    context 'when the performance_bar feature is disabled' do
      before do
        stub_application_setting(performance_bar_allowed_group_id: nil)
      end

      it_behaves_like 'performance bar cannot be displayed'
    end

    context 'when the performance_bar feature is enabled' do
      before do
        stub_application_setting(performance_bar_allowed_group_id: group.id)
      end

      it_behaves_like 'performance bar cannot be displayed'
    end
  end

  context 'when user is logged-in' do
    before do
      user = create(:user)

      sign_in(user)
      group.add_guest(user)

      visit root_path
    end

    context 'when the performance_bar feature is disabled' do
      before do
        stub_application_setting(performance_bar_allowed_group_id: nil)
      end

      it_behaves_like 'performance bar cannot be displayed'
      it_behaves_like 'performance bar is enabled by default in development'
    end

    context 'when the performance_bar feature is enabled' do
      before do
        stub_application_setting(performance_bar_allowed_group_id: group.id)
      end

      it_behaves_like 'performance bar is enabled by default in development'
      it_behaves_like 'performance bar can be displayed'

      it 'does not show Stats link by default' do
        find('body').native.send_keys('pb')

        expect(page).not_to have_link('Stats', visible: :all)
      end

      context 'when GITLAB_PERFORMANCE_BAR_STATS_URL environment variable is set' do
        let(:stats_url) { 'https://log.gprd.gitlab.net/app/dashboards#/view/' }

        before do
          stub_env('GITLAB_PERFORMANCE_BAR_STATS_URL', stats_url)
        end

        it 'shows Stats link' do
          find('body').native.send_keys('pb')

          expect(page).to have_link('Stats', href: stats_url, visible: :all)
        end
      end
    end
  end
end
