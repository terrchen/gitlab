import { GlBadge } from '@gitlab/ui';
import { mount } from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import { member as memberMock } from 'jest/members/mock_data';
import UserAvatar from '~/members/components/avatars/user_avatar.vue';

Vue.use(Vuex);

describe('UserAvatar', () => {
  let wrapper;

  const createComponent = (propsData = {}) => {
    wrapper = mount(UserAvatar, {
      propsData: {
        isCurrentUser: false,
        ...propsData,
      },
      store: new Vuex.Store({
        state: {
          canManageMembers: true,
        },
      }),
    });
  };

  afterEach(() => {
    wrapper.destroy();
  });

  describe('badges', () => {
    it.each`
      member                                          | badgeText
      ${{ ...memberMock, usingLicense: true }}        | ${'Is using seat'}
      ${{ ...memberMock, groupSso: true }}            | ${'SAML'}
      ${{ ...memberMock, groupManagedAccount: true }} | ${'Managed Account'}
      ${{ ...memberMock, canOverride: true }}         | ${'LDAP'}
    `('renders the "$badgeText" badge', ({ member, badgeText }) => {
      createComponent({ member });

      expect(wrapper.find(GlBadge).text()).toBe(badgeText);
    });
  });
});
