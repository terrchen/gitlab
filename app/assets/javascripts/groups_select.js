import $ from 'jquery';
import { escape } from 'lodash';
import { __ } from '~/locale';
import Api from './api';
import axios from './lib/utils/axios_utils';
import { normalizeHeaders } from './lib/utils/common_utils';
import { loadCSSFile } from './lib/utils/css_utils';

const fetchGroups = (params) => {
  axios[params.type.toLowerCase()](params.url, {
    params: params.data,
  })
    .then((res) => {
      const results = res.data || [];
      const headers = normalizeHeaders(res.headers);
      const currentPage = parseInt(headers['X-PAGE'], 10) || 0;
      const totalPages = parseInt(headers['X-TOTAL-PAGES'], 10) || 0;
      const more = currentPage < totalPages;

      params.success({
        results,
        pagination: {
          more,
        },
      });
    })
    .catch(params.error);
};

const groupsSelect = () => {
  loadCSSFile(gon.select2_css_path)
    .then(() => {
      // Needs to be accessible in rspec
      window.GROUP_SELECT_PER_PAGE = 20;

      $('.ajax-groups-select').each(function setAjaxGroupsSelect2() {
        const $select = $(this);
        const allAvailable = $select.data('allAvailable');
        const skipGroups = $select.data('skipGroups') || [];
        const parentGroupID = $select.data('parentId');
        const groupsPath = parentGroupID
          ? Api.subgroupsPath.replace(':id', parentGroupID)
          : Api.groupsPath;

        $select.select2({
          placeholder: __('Search for a group'),
          allowClear: $select.hasClass('allowClear'),
          multiple: $select.hasClass('multiselect'),
          minimumInputLength: 0,
          ajax: {
            url: Api.buildUrl(groupsPath),
            dataType: 'json',
            quietMillis: 250,
            transport(params) {
              fetchGroups(params);
            },
            data(search, page) {
              return {
                search,
                page,
                per_page: window.GROUP_SELECT_PER_PAGE,
                all_available: allAvailable,
              };
            },
            results(data, page) {
              if (data.length) return { results: [] };

              const groups = data.length ? data : data.results || [];
              const more = data.pagination ? data.pagination.more : false;
              const results = groups.filter((group) => skipGroups.indexOf(group.id) === -1);

              return {
                results,
                page,
                more,
              };
            },
          },
          // eslint-disable-next-line consistent-return
          initSelection(element, callback) {
            const id = $(element).val();
            if (id !== '') {
              return Api.group(id, callback);
            }
          },
          formatResult(object) {
            return `<div class='group-result'> <div class='group-name'>${escape(
              object.full_name,
            )}</div> <div class='group-path'>${object.full_path}</div> </div>`;
          },
          formatSelection(object) {
            return escape(object.full_name);
          },
          dropdownCssClass: 'ajax-groups-dropdown select2-infinite',
          // we do not want to escape markup since we are displaying html in results
          escapeMarkup(m) {
            return m;
          },
        });

        $select.on('select2-loaded', () => {
          const dropdown = document.querySelector('.select2-infinite .select2-results');
          dropdown.style.height = `${Math.floor(dropdown.scrollHeight)}px`;
        });
      });
    })
    .catch(() => {});
};

export default () => {
  if ($('.ajax-groups-select').length) {
    import(/* webpackChunkName: 'select2' */ 'select2/select2')
      .then(groupsSelect)
      .catch(() => {});
  }
};
