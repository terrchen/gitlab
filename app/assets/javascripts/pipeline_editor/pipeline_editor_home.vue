<script>
import CommitSection from './components/commit/commit_section.vue';
import PipelineEditorHeader from './components/header/pipeline_editor_header.vue';
import PipelineEditorTabs from './components/pipeline_editor_tabs.vue';
import { TABS_WITH_COMMIT_FORM, CREATE_TAB } from './constants';

export default {
  components: {
    CommitSection,
    PipelineEditorHeader,
    PipelineEditorTabs,
  },
  props: {
    ciConfigData: {
      type: Object,
      required: true,
    },
    ciFileContent: {
      type: String,
      required: true,
    },
    isCiConfigDataLoading: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      currentTab: CREATE_TAB,
    };
  },
  computed: {
    showCommitForm() {
      return TABS_WITH_COMMIT_FORM.includes(this.currentTab);
    },
  },
  methods: {
    setCurrentTab(tabName) {
      this.currentTab = tabName;
    },
  },
};
</script>

<template>
  <div>
    <pipeline-editor-header
      :ci-file-content="ciFileContent"
      :ci-config-data="ciConfigData"
      :is-ci-config-data-loading="isCiConfigDataLoading"
    />
    <pipeline-editor-tabs
      :ci-config-data="ciConfigData"
      :ci-file-content="ciFileContent"
      :is-ci-config-data-loading="isCiConfigDataLoading"
      v-on="$listeners"
      @set-current-tab="setCurrentTab"
    />
    <commit-section v-if="showCommitForm" :ci-file-content="ciFileContent" v-on="$listeners" />
  </div>
</template>
