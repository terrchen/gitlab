import Vue from 'vue';
import Vuex from 'vuex';
import { parseBoolean } from '~/lib/utils/common_utils';
import EditFeatureFlag from './components/edit_feature_flag.vue';
import createStore from './store/edit';

Vue.use(Vuex);

export default () => {
  const el = document.querySelector('#js-edit-feature-flag');
  const {
    environmentsScopeDocsPath,
    strategyTypeDocsPagePath,
    endpoint,
    featureFlagsPath,
    environmentsEndpoint,
    projectId,
    featureFlagIssuesEndpoint,
    userCalloutsPath,
    userCalloutId,
    showUserCallout,
  } = el.dataset;

  return new Vue({
    store: createStore({ endpoint, projectId, path: featureFlagsPath }),
    el,
    provide: {
      environmentsScopeDocsPath,
      strategyTypeDocsPagePath,
      environmentsEndpoint,
      projectId,
      featureFlagIssuesEndpoint,
      userCalloutsPath,
      userCalloutId,
      showUserCallout: parseBoolean(showUserCallout),
    },
    render(createElement) {
      return createElement(EditFeatureFlag);
    },
  });
};
