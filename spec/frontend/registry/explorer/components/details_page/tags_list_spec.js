import { GlButton } from '@gitlab/ui';
import { shallowMount } from '@vue/test-utils';
import component from '~/registry/explorer/components/details_page/tags_list.vue';
import TagsListRow from '~/registry/explorer/components/details_page/tags_list_row.vue';
import { TAGS_LIST_TITLE, REMOVE_TAGS_BUTTON_TITLE } from '~/registry/explorer/constants/index';
import { tagsMock } from '../../mock_data';

describe('Tags List', () => {
  let wrapper;
  const tags = [...tagsMock];
  const readOnlyTags = tags.map((t) => ({ ...t, canDelete: false }));

  const findTagsListRow = () => wrapper.findAll(TagsListRow);
  const findDeleteButton = () => wrapper.find(GlButton);
  const findListTitle = () => wrapper.find('[data-testid="list-title"]');

  const mountComponent = (propsData = { tags, isMobile: false }) => {
    wrapper = shallowMount(component, {
      propsData,
    });
  };

  afterEach(() => {
    wrapper.destroy();
    wrapper = null;
  });

  describe('List title', () => {
    it('exists', () => {
      mountComponent();

      expect(findListTitle().exists()).toBe(true);
    });

    it('has the correct text', () => {
      mountComponent();

      expect(findListTitle().text()).toBe(TAGS_LIST_TITLE);
    });
  });

  describe('delete button', () => {
    it.each`
      inputTags       | isMobile | isVisible
      ${tags}         | ${false} | ${true}
      ${tags}         | ${true}  | ${false}
      ${readOnlyTags} | ${false} | ${false}
      ${readOnlyTags} | ${true}  | ${false}
    `(
      'is $isVisible that delete button exists when tags is $inputTags and isMobile is $isMobile',
      ({ inputTags, isMobile, isVisible }) => {
        mountComponent({ tags: inputTags, isMobile });

        expect(findDeleteButton().exists()).toBe(isVisible);
      },
    );

    it('has the correct text', () => {
      mountComponent();

      expect(findDeleteButton().text()).toBe(REMOVE_TAGS_BUTTON_TITLE);
    });

    it('has the correct props', () => {
      mountComponent();

      expect(findDeleteButton().attributes()).toMatchObject({
        category: 'secondary',
        variant: 'danger',
      });
    });

    it.each`
      disabled | doSelect | buttonDisabled
      ${true}  | ${false} | ${'true'}
      ${true}  | ${true}  | ${'true'}
      ${false} | ${false} | ${'true'}
      ${false} | ${true}  | ${undefined}
    `(
      'is $buttonDisabled that the button is disabled when the component disabled state is $disabled and is $doSelect that the user selected a tag',
      async ({ disabled, buttonDisabled, doSelect }) => {
        mountComponent({ tags, disabled, isMobile: false });

        if (doSelect) {
          findTagsListRow().at(0).vm.$emit('select');
          await wrapper.vm.$nextTick();
        }

        expect(findDeleteButton().attributes('disabled')).toBe(buttonDisabled);
      },
    );

    it('click event emits a deleted event with selected items', () => {
      mountComponent();
      findTagsListRow().at(0).vm.$emit('select');

      findDeleteButton().vm.$emit('click');
      expect(wrapper.emitted('delete')).toEqual([[{ 'beta-24753': true }]]);
    });
  });

  describe('list rows', () => {
    it('one row exist for each tag', () => {
      mountComponent();

      expect(findTagsListRow()).toHaveLength(tags.length);
    });

    it('the correct props are bound to it', () => {
      mountComponent({ tags, disabled: true });

      const rows = findTagsListRow();

      expect(rows.at(0).attributes()).toMatchObject({
        first: 'true',
        disabled: 'true',
      });
    });

    describe('events', () => {
      it('select event update the selected items', async () => {
        mountComponent();
        findTagsListRow().at(0).vm.$emit('select');
        await wrapper.vm.$nextTick();
        expect(findTagsListRow().at(0).attributes('selected')).toBe('true');
      });

      it('delete event emit a delete event', () => {
        mountComponent();
        findTagsListRow().at(0).vm.$emit('delete');
        expect(wrapper.emitted('delete')).toEqual([[{ 'beta-24753': true }]]);
      });
    });
  });
});
