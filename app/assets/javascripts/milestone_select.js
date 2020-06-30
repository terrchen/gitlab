/* eslint-disable one-var, no-self-compare, consistent-return, no-param-reassign, no-shadow */
/* global Issuable */
/* global ListMilestone */

import $ from 'jquery';
import { template, escape } from 'lodash';
import { __, sprintf } from '~/locale';
import '~/gl_dropdown';
import Api from '~/api';
import axios from './lib/utils/axios_utils';
import { timeFor, parsePikadayDate, dateInWords } from './lib/utils/datetime_utility';
import ModalStore from './boards/stores/modal_store';
import boardsStore, {
  boardStoreIssueSet,
  boardStoreIssueDelete,
} from './boards/stores/boards_store';

export default class MilestoneSelect {
  constructor(currentProject, els, options = {}) {
    if (currentProject !== null) {
      this.currentProject =
        typeof currentProject === 'string' ? JSON.parse(currentProject) : currentProject;
    }

    MilestoneSelect.init(els, options);
  }

  static init(els, options) {
    let $els = $(els);

    if (!els) {
      $els = $('.js-milestone-select');
    }

    $els.each((i, dropdown) => {
      let milestoneLinkNoneTemplate,
        milestoneLinkTemplate,
        milestoneExpiredLinkTemplate,
        selectedMilestone,
        selectedMilestoneDefault;
      const $dropdown = $(dropdown);
      const issueUpdateURL = $dropdown.data('issueUpdate');
      const showNo = $dropdown.data('showNo');
      const showAny = $dropdown.data('showAny');
      const showMenuAbove = $dropdown.data('showMenuAbove');
      const showUpcoming = $dropdown.data('showUpcoming');
      const showStarted = $dropdown.data('showStarted');
      const useId = $dropdown.data('useId');
      const defaultLabel = $dropdown.data('defaultLabel');
      const defaultNo = $dropdown.data('defaultNo');
      const abilityName = $dropdown.data('abilityName');
      const $selectBox = $dropdown.closest('.selectbox');
      const $block = $selectBox.closest('.block');
      const $sidebarCollapsedValue = $block.find('.sidebar-collapsed-icon');
      const $value = $block.find('.value');
      // eslint-disable-next-line no-jquery/no-fade
      const $loading = $block.find('.block-loading').fadeOut();
      selectedMilestoneDefault = showAny ? '' : null;
      selectedMilestoneDefault =
        showNo && defaultNo ? __('No milestone') : selectedMilestoneDefault;
      selectedMilestone = $dropdown.data('selected') || selectedMilestoneDefault;

      if (issueUpdateURL) {
        milestoneLinkTemplate = template(
          '<a href="<%- web_url %>" class="bold has-tooltip" data-container="body" title="<%- remaining %>"><%- title %></a>',
        );
        milestoneExpiredLinkTemplate = template(
          '<a href="<%- web_url %>" class="bold has-tooltip" data-container="body" title="<%- remaining %>"><%- title %> (Past due)</a>',
        );
        milestoneLinkNoneTemplate = `<span class="no-value">${__('None')}</span>`;
      }
      return $dropdown.glDropdown({
        showMenuAbove,
        data: (term, callback) => {
          let contextId = $dropdown.get(0).dataset.projectId;
          let getMilestones = Api.projectMilestones;

          if (!contextId) {
            contextId = $dropdown.get(0).dataset.groupId;
            getMilestones = Api.groupMilestones;
          }

          // We don't use $.data() as it caches initial value and never updates!
          return getMilestones(contextId, { state: 'active' })
            .then(({ data }) =>
              data
                .map(m => ({
                  ...m,
                  // Public API includes `title` instead of `name`.
                  name: m.title,
                }))
                .sort((mA, mB) => {
                  // Move all expired milestones to the bottom.
                  if (mA.expired) {
                    return 1;
                  }
                  if (mB.expired) {
                    return -1;
                  }
                  return 0;
                }),
            )
            .then(data => {
              const extraOptions = [];
              if (showAny) {
                extraOptions.push({
                  id: null,
                  name: null,
                  title: __('Any milestone'),
                });
              }
              if (showNo) {
                extraOptions.push({
                  id: -1,
                  name: __('No milestone'),
                  title: __('No milestone'),
                });
              }
              if (showUpcoming) {
                extraOptions.push({
                  id: -2,
                  name: '#upcoming',
                  title: __('Upcoming'),
                });
              }
              if (showStarted) {
                extraOptions.push({
                  id: -3,
                  name: '#started',
                  title: __('Started'),
                });
              }
              if (extraOptions.length) {
                extraOptions.push({ type: 'divider' });
              }

              callback(extraOptions.concat(data));
              if (showMenuAbove) {
                $dropdown.data('glDropdown').positionMenuAbove();
              }
              $(`[data-milestone-id="${selectedMilestone}"] > a`).addClass('is-active');
            });
        },
        renderRow: milestone => {
          const milestoneName = milestone.title || milestone.name;
          let milestoneDisplayName = escape(milestoneName);

          if (milestone.expired) {
            milestoneDisplayName = sprintf(__('%{milestone} (expired)'), {
              milestone: milestoneDisplayName,
            });
          }

          return `
          <li data-milestone-id="${escape(milestoneName)}">
            <a href='#' class='dropdown-menu-milestone-link'>
              ${milestoneDisplayName}
            </a>
          </li>
        `;
        },
        filterable: true,
        search: {
          fields: ['title'],
        },
        selectable: true,
        toggleLabel: (selected, el) => {
          if (selected && 'id' in selected && $(el).hasClass('is-active')) {
            return selected.title;
          }
          return defaultLabel;
        },
        defaultLabel,
        fieldName: $dropdown.data('fieldName'),
        text: milestone => escape(milestone.title),
        id: milestone => {
          if (milestone !== undefined) {
            if (!useId && !$dropdown.is('.js-issuable-form-dropdown')) {
              return milestone.name;
            }

            return milestone.id;
          }
        },
        hidden: () => {
          $selectBox.hide();
          // display:block overrides the hide-collapse rule
          return $value.css('display', '');
        },
        opened: e => {
          const $el = $(e.currentTarget);
          if ($dropdown.hasClass('js-issue-board-sidebar') || options.handleClick) {
            selectedMilestone = $dropdown[0].dataset.selected || selectedMilestoneDefault;
          }
          $('a.is-active', $el).removeClass('is-active');
          $(`[data-milestone-id="${selectedMilestone}"] > a`, $el).addClass('is-active');
        },
        vue: $dropdown.hasClass('js-issue-board-sidebar'),
        clicked: clickEvent => {
          const { e } = clickEvent;
          let selected = clickEvent.selectedObj;

          let data, modalStoreFilter;
          if (!selected) return;

          if (options.handleClick) {
            e.preventDefault();
            options.handleClick(selected);
            return;
          }

          const page = $('body').attr('data-page');
          const isIssueIndex = page === 'projects:issues:index';
          const isMRIndex = page === page && page === 'projects:merge_requests:index';
          const isSelecting = selected.name !== selectedMilestone;
          selectedMilestone = isSelecting ? selected.name : selectedMilestoneDefault;

          if (
            $dropdown.hasClass('js-filter-bulk-update') ||
            $dropdown.hasClass('js-issuable-form-dropdown')
          ) {
            e.preventDefault();
            return;
          }

          if ($dropdown.closest('.add-issues-modal').length) {
            modalStoreFilter = ModalStore.store.filter;
          }

          if (modalStoreFilter) {
            modalStoreFilter[$dropdown.data('fieldName')] = selected.name;
            e.preventDefault();
          } else if ($dropdown.hasClass('js-filter-submit') && (isIssueIndex || isMRIndex)) {
            return Issuable.filterResults($dropdown.closest('form'));
          } else if ($dropdown.hasClass('js-filter-submit')) {
            return $dropdown.closest('form').submit();
          } else if ($dropdown.hasClass('js-issue-board-sidebar')) {
            if (selected.id !== -1 && isSelecting) {
              boardStoreIssueSet(
                'milestone',
                new ListMilestone({
                  id: selected.id,
                  title: selected.name,
                }),
              );
            } else {
              boardStoreIssueDelete('milestone');
            }

            $dropdown.trigger('loading.gl.dropdown');
            // eslint-disable-next-line no-jquery/no-fade
            $loading.removeClass('hidden').fadeIn();

            boardsStore.detail.issue
              .update($dropdown.attr('data-issue-update'))
              .then(() => {
                $dropdown.trigger('loaded.gl.dropdown');
                // eslint-disable-next-line no-jquery/no-fade
                $loading.fadeOut();
              })
              .catch(() => {
                // eslint-disable-next-line no-jquery/no-fade
                $loading.fadeOut();
              });
          } else {
            selected = $selectBox.find('input[type="hidden"]').val();
            data = {};
            data[abilityName] = {};
            data[abilityName].milestone_id = selected != null ? selected : null;
            // eslint-disable-next-line no-jquery/no-fade
            $loading.removeClass('hidden').fadeIn();
            $dropdown.trigger('loading.gl.dropdown');
            return axios
              .put(issueUpdateURL, data)
              .then(({ data }) => {
                $dropdown.trigger('loaded.gl.dropdown');
                // eslint-disable-next-line no-jquery/no-fade
                $loading.fadeOut();
                $selectBox.hide();
                $value.css('display', '');
                if (data.milestone != null) {
                  data.milestone.remaining = timeFor(data.milestone.due_date);
                  data.milestone.name = data.milestone.title;
                  $value.html(
                    data.milestone.expired
                      ? milestoneExpiredLinkTemplate({
                          ...data.milestone,
                          remaining: sprintf(__('%{due_date} (Past due)'), {
                            due_date: dateInWords(parsePikadayDate(data.milestone.due_date)),
                          }),
                        })
                      : milestoneLinkTemplate(data.milestone),
                  );
                  return $sidebarCollapsedValue
                    .attr(
                      'data-original-title',
                      `${data.milestone.name}<br />${data.milestone.remaining}`,
                    )
                    .find('span')
                    .text(data.milestone.title);
                }
                $value.html(milestoneLinkNoneTemplate);
                return $sidebarCollapsedValue
                  .attr('data-original-title', __('Milestone'))
                  .find('span')
                  .text(__('None'));
              })
              .catch(() => {
                // eslint-disable-next-line no-jquery/no-fade
                $loading.fadeOut();
              });
          }
        },
      });
    });
  }
}

window.MilestoneSelect = MilestoneSelect;
