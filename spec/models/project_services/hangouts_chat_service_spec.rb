# frozen_string_literal: true

require "spec_helper"

RSpec.describe HangoutsChatService do
  it_behaves_like "chat service", "Hangouts Chat" do
    let(:client) { HangoutsChat::Sender }
    let(:client_arguments) { webhook_url }
    let(:payload) do
      {
        text: be_present
      }
    end
  end
end
