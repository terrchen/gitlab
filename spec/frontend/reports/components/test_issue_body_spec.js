import Vue from 'vue';
import { trimText } from 'helpers/text_helper';
import { mountComponentWithStore } from 'helpers/vue_mount_component_helper';
import component from '~/reports/components/test_issue_body.vue';
import createStore from '~/reports/store';
import { issue } from '../mock_data/mock_data';

describe('Test Issue body', () => {
  let vm;
  const Component = Vue.extend(component);
  const store = createStore();

  const commonProps = {
    issue,
    status: 'failed',
  };

  afterEach(() => {
    vm.$destroy();
  });

  describe('on click', () => {
    it('calls openModal action', () => {
      vm = mountComponentWithStore(Component, {
        store,
        props: commonProps,
      });

      jest.spyOn(vm, 'openModal').mockImplementation(() => {});

      vm.$el.querySelector('button').click();

      expect(vm.openModal).toHaveBeenCalledWith({
        issue: commonProps.issue,
      });
    });
  });

  describe('is new', () => {
    beforeEach(() => {
      vm = mountComponentWithStore(Component, {
        store,
        props: { ...commonProps, isNew: true },
      });
    });

    it('renders issue name', () => {
      expect(vm.$el.textContent).toContain(commonProps.issue.name);
    });

    it('renders new badge', () => {
      expect(trimText(vm.$el.querySelector('.badge').textContent)).toEqual('New');
    });
  });

  describe('not new', () => {
    beforeEach(() => {
      vm = mountComponentWithStore(Component, {
        store,
        props: commonProps,
      });
    });

    it('renders issue name', () => {
      expect(vm.$el.textContent).toContain(commonProps.issue.name);
    });

    it('does not renders new badge', () => {
      expect(vm.$el.querySelector('.badge')).toEqual(null);
    });
  });
});
