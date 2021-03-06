<script>
import { mapActions, mapState, mapGetters } from 'vuex';
import IssueModal from 'ee/vue_shared/security_reports/components/modal.vue';
import { vulnerabilityModalMixin } from 'ee/vue_shared/security_reports/mixins/vulnerability_modal_mixin';
import Filters from './filters.vue';
import FuzzingArtifactsDownload from './fuzzing_artifacts_download.vue';
import LoadingError from './loading_error.vue';
import SecurityDashboardLayout from './security_dashboard_layout.vue';
import SecurityDashboardTable from './security_dashboard_table.vue';

export default {
  components: {
    Filters,
    IssueModal,
    SecurityDashboardLayout,
    SecurityDashboardTable,
    FuzzingArtifactsDownload,
    LoadingError,
  },
  mixins: [vulnerabilityModalMixin('vulnerabilities')],
  props: {
    vulnerabilitiesEndpoint: {
      type: String,
      required: true,
    },
    pipelineId: {
      type: Number,
      required: false,
      default: null,
    },
    loadingErrorIllustrations: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  computed: {
    ...mapState('vulnerabilities', [
      'modal',
      'pageInfo',
      'loadingVulnerabilitiesErrorCode',
      'isCreatingIssue',
      'isDismissingVulnerability',
      'isCreatingMergeRequest',
    ]),
    ...mapState('pipelineJobs', ['projectId']),
    ...mapState('filters', ['filters']),
    ...mapGetters('vulnerabilities', ['loadingVulnerabilitiesFailedWithRecognizedErrorCode']),
    ...mapGetters('pipelineJobs', ['hasFuzzingArtifacts', 'fuzzingJobsWithArtifact']),
    canCreateIssue() {
      const path = this.vulnerability.create_vulnerability_feedback_issue_path;
      return Boolean(path);
    },
    canCreateMergeRequest() {
      const path = this.vulnerability.create_vulnerability_feedback_merge_request_path;
      return Boolean(path);
    },
    canDismissVulnerability() {
      const path = this.vulnerability.create_vulnerability_feedback_dismissal_path;
      return Boolean(path);
    },
    vulnerability() {
      return this.modal.vulnerability;
    },
  },
  created() {
    this.setPipelineId(this.pipelineId);
    this.setVulnerabilitiesEndpoint(this.vulnerabilitiesEndpoint);
    this.fetchPipelineJobs();
  },
  methods: {
    ...mapActions('vulnerabilities', [
      'closeDismissalCommentBox',
      'createIssue',
      'createMergeRequest',
      'openDismissalCommentBox',
      'setPipelineId',
      'setVulnerabilitiesEndpoint',
      'showDismissalDeleteButtons',
      'hideDismissalDeleteButtons',
      'downloadPatch',
    ]),
    ...mapActions('pipelineJobs', ['fetchPipelineJobs']),
    ...mapActions('filters', ['lockFilter', 'setHideDismissedToggleInitialState']),
  },
};
</script>

<template>
  <section>
    <loading-error
      v-if="loadingVulnerabilitiesFailedWithRecognizedErrorCode"
      :error-code="loadingVulnerabilitiesErrorCode"
      :illustrations="loadingErrorIllustrations"
    />
    <template v-else>
      <security-dashboard-layout>
        <template #header>
          <filters>
            <template v-if="hasFuzzingArtifacts" #buttons>
              <fuzzing-artifacts-download :jobs="fuzzingJobsWithArtifact" :project-id="projectId">
                <template #label>
                  <strong>{{ s__('SecurityReports|Download Report') }}</strong>
                </template>
              </fuzzing-artifacts-download>
            </template>
          </filters>
        </template>

        <security-dashboard-table>
          <template #empty-state>
            <slot name="empty-state"></slot>
          </template>
        </security-dashboard-table>
      </security-dashboard-layout>

      <issue-modal
        :modal="modal"
        :can-create-issue="canCreateIssue"
        :can-create-merge-request="canCreateMergeRequest"
        :can-dismiss-vulnerability="canDismissVulnerability"
        :is-creating-issue="isCreatingIssue"
        :is-dismissing-vulnerability="isDismissingVulnerability"
        :is-creating-merge-request="isCreatingMergeRequest"
        @addDismissalComment="handleAddDismissalComment({ vulnerability, comment: $event })"
        @editVulnerabilityDismissalComment="openDismissalCommentBox"
        @showDismissalDeleteButtons="showDismissalDeleteButtons"
        @hideDismissalDeleteButtons="hideDismissalDeleteButtons"
        @deleteDismissalComment="handleDeleteDismissalComment({ vulnerability })"
        @closeDismissalCommentBox="closeDismissalCommentBox"
        @createMergeRequest="createMergeRequest({ vulnerability })"
        @createNewIssue="createIssue({ vulnerability })"
        @dismissVulnerability="handleDismissVulnerability({ vulnerability, comment: $event })"
        @openDismissalCommentBox="openDismissalCommentBox"
        @revertDismissVulnerability="handleRevertDismissVulnerability({ vulnerability })"
        @downloadPatch="downloadPatch({ vulnerability })"
      />
    </template>
  </section>
</template>
