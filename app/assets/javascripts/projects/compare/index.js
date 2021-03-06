import Vue from 'vue';
import CompareApp from './components/app.vue';
import CompareAppLegacy from './components/app_legacy.vue';

export default function init() {
  const el = document.getElementById('js-compare-selector');

  if (gon.features?.compareRepoDropdown) {
    const {
      refsProjectPath,
      paramsFrom,
      paramsTo,
      projectCompareIndexPath,
      projectMergeRequestPath,
      createMrPath,
      projectTo,
      projectsFrom,
    } = el.dataset;

    return new Vue({
      el,
      components: {
        CompareApp,
      },
      provide: {
        projectTo: JSON.parse(projectTo),
        projectsFrom: JSON.parse(projectsFrom),
      },
      render(createElement) {
        return createElement(CompareApp, {
          props: {
            refsProjectPath,
            paramsFrom,
            paramsTo,
            projectCompareIndexPath,
            projectMergeRequestPath,
            createMrPath,
          },
        });
      },
    });
  }

  const {
    refsProjectPath,
    paramsFrom,
    paramsTo,
    projectCompareIndexPath,
    projectMergeRequestPath,
    createMrPath,
  } = el.dataset;

  return new Vue({
    el,
    components: {
      CompareAppLegacy,
    },
    render(createElement) {
      return createElement(CompareAppLegacy, {
        props: {
          refsProjectPath,
          paramsFrom,
          paramsTo,
          projectCompareIndexPath,
          projectMergeRequestPath,
          createMrPath,
        },
      });
    },
  });
}
