import { shallowMount } from '@vue/test-utils';
import ReplyPlaceholder from '~/notes/components/discussion_reply_placeholder.vue';
import DesignDiscussion from 'ee/design_management/components/design_notes/design_discussion.vue';
import DesignNote from 'ee/design_management/components/design_notes/design_note.vue';
import DesignReplyForm from 'ee/design_management/components/design_notes/design_reply_form.vue';
import createNoteMutation from 'ee/design_management/graphql/mutations/createNote.mutation.graphql';

describe('Design discussions component', () => {
  let wrapper;

  const findReplyPlaceholder = () => wrapper.find(ReplyPlaceholder);
  const findReplyForm = () => wrapper.find(DesignReplyForm);

  const mutationVariables = {
    mutation: createNoteMutation,
    update: expect.anything(),
    variables: {
      input: {
        noteableId: 'noteable-id',
        body: 'test',
        discussionId: '0',
      },
    },
  };
  const mutate = jest.fn(() => Promise.resolve());
  const $apollo = {
    mutate,
  };

  function createComponent(props = {}) {
    wrapper = shallowMount(DesignDiscussion, {
      sync: false,
      propsData: {
        discussion: {
          id: '0',
          notes: [
            {
              id: '1',
            },
            {
              id: '2',
            },
          ],
        },
        noteableId: 'noteable-id',
        designId: 'design-id',
        discussionIndex: 1,
        ...props,
      },
      stubs: {
        ReplyPlaceholder,
      },
      mocks: { $apollo },
    });
  }

  beforeEach(() => {
    createComponent();
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('renders correct amount of discussion notes', () => {
    expect(wrapper.findAll(DesignNote).length).toBe(2);
  });

  it('renders reply placeholder by default', () => {
    expect(findReplyPlaceholder().exists()).toBe(true);
  });

  it('hides reply placeholder and opens form on placeholder click', () => {
    findReplyPlaceholder().trigger('click');

    return wrapper.vm.$nextTick().then(() => {
      expect(findReplyPlaceholder().exists()).toBe(false);
      expect(findReplyForm().exists()).toBe(true);
    });
  });

  it('calls mutation on submitting form and closes the form', () => {
    wrapper.setData({
      discussionComment: 'test',
      isFormRendered: true,
    });

    return wrapper.vm
      .$nextTick()
      .then(() => {
        findReplyForm().vm.$emit('submitForm');

        expect(mutate).toHaveBeenCalledWith(mutationVariables);

        return wrapper.vm.addDiscussionComment();
      })
      .then(() => {
        expect(findReplyForm().exists()).toBe(false);
      });
  });
});
