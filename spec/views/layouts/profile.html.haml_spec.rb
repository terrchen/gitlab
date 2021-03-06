# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'layouts/profile' do
  let(:user) { create(:user) }

  before do
    allow(view).to receive(:session).and_return({})
    allow(view).to receive(:current_user).and_return(user)
    allow(view).to receive(:current_user_mode).and_return(Gitlab::Auth::CurrentUserMode.new(user))
    allow(view).to receive(:experiment_enabled?).and_return(false)
    allow(view).to receive(:enable_search_settings).and_call_original
  end

  it 'calls enable_search_settings helper with a custom container class' do
    render
    expect(view).to have_received(:enable_search_settings)
                      .with({ locals: { container_class: 'gl-my-5' } })
  end

  context 'when search_settings_in_page feature flag is on' do
    it 'displays the search settings entry point' do
      render
      expect(rendered).to include('js-search-settings-app')
    end
  end

  context 'when search_settings_in_page feature flag is off' do
    before do
      stub_feature_flags(search_settings_in_page: false)
    end

    it 'does not display the search settings entry point' do
      render
      expect(rendered).not_to include('js-search-settings-app')
    end
  end
end
