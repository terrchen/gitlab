# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Groups > Members > Manage members' do
  include Select2Helper
  include Spec::Support::Helpers::Features::MembersHelpers

  let(:user1) { create(:user, name: 'John Doe') }
  let(:user2) { create(:user, name: 'Mary Jane') }
  let(:group) { create(:group) }

  before do
    stub_feature_flags(invite_members_group_modal: false)
    sign_in(user1)
  end

  shared_examples 'includes the correct Invite link' do |should_include, should_not_include|
    it 'includes either the form or the modal trigger' do
      group.add_owner(user1)

      visit group_group_members_path(group)

      expect(page).to have_selector(should_include)
      expect(page).not_to have_selector(should_not_include)
    end
  end

  context 'when Invite Members modal is enabled' do
    before do
      stub_feature_flags(invite_members_group_modal: true)
    end

    it_behaves_like 'includes the correct Invite link', '.js-invite-members-trigger', '.invite-users-form'
    it_behaves_like 'includes the correct Invite link', '.js-invite-group-trigger', '.invite-group-form'
  end

  context 'when Invite Members modal is disabled' do
    it_behaves_like 'includes the correct Invite link', '.invite-users-form', '.js-invite-members-trigger'
    it_behaves_like 'includes the correct Invite link', '.invite-group-form', '.js-invite-group-trigger'
  end

  it 'update user to owner level', :js do
    group.add_owner(user1)
    group.add_developer(user2)

    visit group_group_members_path(group)

    page.within(second_row) do
      click_button('Developer')
      click_button('Owner')

      expect(page).to have_button('Owner')
    end
  end

  it 'add user to group', :js do
    group.add_owner(user1)

    visit group_group_members_path(group)

    add_user(user2.id, 'Reporter')

    page.within(second_row) do
      expect(page).to have_content(user2.name)
      expect(page).to have_button('Reporter')
    end
  end

  it 'do not disclose email addresses', :js do
    group.add_owner(user1)
    create(:user, email: 'undisclosed_email@gitlab.com', name: "Jane 'invisible' Doe")

    visit group_group_members_path(group)

    find('.select2-container').click
    select_input = find('.select2-input')

    select_input.send_keys('@gitlab.com')
    wait_for_requests

    expect(page).to have_content('No matches found')

    select_input.native.clear
    select_input.send_keys('undisclosed_email@gitlab.com')
    wait_for_requests

    expect(page).to have_content("Jane 'invisible' Doe")
  end

  it 'remove user from group', :js do
    group.add_owner(user1)
    group.add_developer(user2)

    visit group_group_members_path(group)

    # Open modal
    page.within(second_row) do
      click_button 'Remove member'
    end

    page.within('[role="dialog"]') do
      expect(page).to have_unchecked_field 'Also unassign this user from related issues and merge requests'
      click_button('Remove member')
    end

    wait_for_requests

    expect(page).not_to have_content(user2.name)
    expect(group.users).not_to include(user2)
  end

  it 'add yourself to group when already an owner', :js do
    group.add_owner(user1)

    visit group_group_members_path(group)

    add_user(user1.id, 'Reporter')

    page.within(first_row) do
      expect(page).to have_content(user1.name)
      expect(page).to have_content('Owner')
    end
  end

  it 'invite user to group', :js do
    group.add_owner(user1)

    visit group_group_members_path(group)

    add_user('test@example.com', 'Reporter')

    expect(page).to have_link 'Invited'
    click_link 'Invited'

    page.within(members_table) do
      expect(page).to have_content('test@example.com')
      expect(page).to have_content('Invited')
      expect(page).to have_button('Reporter')
    end
  end

  it 'guest can not manage other users', :js do
    group.add_guest(user1)
    group.add_developer(user2)

    visit group_group_members_path(group)

    expect(page).not_to have_selector '.invite-users-form'
    expect(page).not_to have_selector '.invite-group-form'

    page.within(second_row) do
      # Can not modify user2 role
      expect(page).not_to have_button 'Developer'

      # Can not remove user2
      expect(page).not_to have_selector 'button[title="Remove member"]'
    end
  end

  def add_user(id, role)
    page.within ".invite-users-form" do
      select2(id, from: "#user_ids", multiple: true)
      select(role, from: "access_level")
      click_button "Invite"
    end
  end
end
