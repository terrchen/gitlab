# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Groups::DestroyService do
  let!(:user) { create(:user) }
  let!(:group) { create(:group) }

  subject { described_class.new(group, user, {}) }

  context 'audit events' do
    include_examples 'audit event logging' do
      let(:operation) { subject.execute }
      let(:fail_condition!) do
        expect_any_instance_of(Group)
          .to receive(:destroy).and_return(group)
      end

      let(:attributes) do
        {
           author_id: user.id,
           entity_id: group.id,
           entity_type: 'Group',
           details: {
             remove: 'group',
             author_name: user.name,
             target_id: group.id,
             target_type: 'Group',
             target_details: group.full_path
           }
         }
      end
    end
  end

  context 'dependency_proxy_blobs' do
    let_it_be(:blob) { create(:dependency_proxy_blob) }
    let_it_be(:group) { blob.group }

    before do
      group.add_maintainer(user)
    end

    it 'destroys the dependency proxy blobs' do
      expect { subject.execute }.to change { DependencyProxy::Blob.count }.by(-1)
    end
  end
end
