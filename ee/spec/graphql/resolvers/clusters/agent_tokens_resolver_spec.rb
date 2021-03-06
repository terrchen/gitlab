# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Resolvers::Clusters::AgentTokensResolver do
  include GraphqlHelpers

  it { expect(described_class.type).to eq(Types::Clusters::AgentTokenType) }
  it { expect(described_class.null).to be_truthy }

  describe '#resolve' do
    let(:agent) { create(:cluster_agent) }
    let(:user) { create(:user, maintainer_projects: [agent.project]) }
    let(:feature_available) { true }
    let(:ctx) { Hash(current_user: user) }

    let!(:matching_token1) { create(:cluster_agent_token, agent: agent) }
    let!(:mathcing_token2) { create(:cluster_agent_token, agent: agent) }
    let!(:other_token) { create(:cluster_agent_token) }

    subject { resolve(described_class, obj: agent, ctx: ctx) }

    before do
      stub_licensed_features(cluster_agents: feature_available)
    end

    it 'returns tokens associated with the agent' do
      expect(subject).to contain_exactly(matching_token1, mathcing_token2)
    end

    context 'feature is not available' do
      let(:feature_available) { false }

      it { is_expected.to be_empty }
    end

    context 'user does not have permission' do
      let(:user) { create(:user, developer_projects: [agent.project]) }

      it { is_expected.to be_empty }
    end
  end
end
