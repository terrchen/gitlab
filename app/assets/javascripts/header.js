import $ from 'jquery';
import Vue from 'vue';
import Translate from '~/vue_shared/translate';
import { highCountTrim } from '~/lib/utils/text_utility';
import SetStatusModalTrigger from './set_status_modal/set_status_modal_trigger.vue';
import SetStatusModalWrapper from './set_status_modal/set_status_modal_wrapper.vue';
import { parseBoolean } from '~/lib/utils/common_utils';
import Tracking from '~/tracking';

/**
 * Updates todo counter when todos are toggled.
 * When count is 0, we hide the badge.
 *
 * @param {jQuery.Event} e
 * @param {String} count
 */
export default function initTodoToggle() {
  $(document).on('todo:toggle', (e, count) => {
    const $todoPendingCount = $('.todos-count');

    $todoPendingCount.text(highCountTrim(count));
    $todoPendingCount.toggleClass('hidden', count === 0);
  });
}

function initStatusTriggers() {
  const setStatusModalTriggerEl = document.querySelector('.js-set-status-modal-trigger');
  const setStatusModalWrapperEl = document.querySelector('.js-set-status-modal-wrapper');

  if (setStatusModalTriggerEl || setStatusModalWrapperEl) {
    Vue.use(Translate);

    // eslint-disable-next-line no-new
    new Vue({
      el: setStatusModalTriggerEl,
      data() {
        const { hasStatus } = this.$options.el.dataset;

        return {
          hasStatus: parseBoolean(hasStatus),
        };
      },
      render(createElement) {
        return createElement(SetStatusModalTrigger, {
          props: {
            hasStatus: this.hasStatus,
          },
        });
      },
    });

    // eslint-disable-next-line no-new
    new Vue({
      el: setStatusModalWrapperEl,
      data() {
        const { currentEmoji, currentMessage } = this.$options.el.dataset;

        return {
          currentEmoji,
          currentMessage,
        };
      },
      render(createElement) {
        const { currentEmoji, currentMessage } = this;

        return createElement(SetStatusModalWrapper, {
          props: {
            currentEmoji,
            currentMessage,
          },
        });
      },
    });
  }
}

export function initNavUserDropdownTracking() {
  const el = document.querySelector('.js-nav-user-dropdown');
  const buyEl = document.querySelector('.js-buy-ci-minutes-link');

  if (el && buyEl) {
    const { trackLabel, trackProperty } = buyEl.dataset;
    const trackEvent = 'show_buy_ci_minutes';

    $(el).on('shown.bs.dropdown', () => {
      Tracking.event(undefined, trackEvent, {
        label: trackLabel,
        property: trackProperty,
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  requestIdleCallback(initStatusTriggers);
  initNavUserDropdownTracking();
});
