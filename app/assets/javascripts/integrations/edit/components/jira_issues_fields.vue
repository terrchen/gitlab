<script>
import {
  GlFormGroup,
  GlFormCheckbox,
  GlFormInput,
  GlSprintf,
  GlLink,
  GlButton,
  GlCard,
} from '@gitlab/ui';
import glFeatureFlagsMixin from '~/vue_shared/mixins/gl_feature_flags_mixin';
import eventHub from '../event_hub';

export default {
  name: 'JiraIssuesFields',
  components: {
    GlFormGroup,
    GlFormCheckbox,
    GlFormInput,
    GlSprintf,
    GlLink,
    GlButton,
    GlCard,
    JiraIssueCreationVulnerabilities: () =>
      import('ee_component/integrations/edit/components/jira_issue_creation_vulnerabilities.vue'),
  },
  mixins: [glFeatureFlagsMixin()],
  props: {
    showJiraIssuesIntegration: {
      type: Boolean,
      required: false,
      default: false,
    },
    showJiraVulnerabilitiesIntegration: {
      type: Boolean,
      required: false,
      default: false,
    },
    initialEnableJiraIssues: {
      type: Boolean,
      required: false,
      default: null,
    },
    initialEnableJiraVulnerabilities: {
      type: Boolean,
      required: false,
      default: false,
    },
    initialVulnerabilitiesIssuetype: {
      type: String,
      required: false,
      default: undefined,
    },
    initialProjectKey: {
      type: String,
      required: false,
      default: null,
    },
    gitlabIssuesEnabled: {
      type: Boolean,
      required: false,
      default: true,
    },
    upgradePlanPath: {
      type: String,
      required: false,
      default: '',
    },
    editProjectPath: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      enableJiraIssues: this.initialEnableJiraIssues,
      projectKey: this.initialProjectKey,
      validated: false,
    };
  },
  computed: {
    validProjectKey() {
      return !this.enableJiraIssues || Boolean(this.projectKey) || !this.validated;
    },
    showJiraVulnerabilitiesOptions() {
      return (
        this.enableJiraIssues &&
        this.showJiraVulnerabilitiesIntegration &&
        this.glFeatures.jiraForVulnerabilities
      );
    },
  },
  created() {
    eventHub.$on('validateForm', this.validateForm);
  },
  beforeDestroy() {
    eventHub.$off('validateForm', this.validateForm);
  },
  methods: {
    validateForm() {
      this.validated = true;
    },
    getJiraIssueTypes() {
      eventHub.$emit('getJiraIssueTypes');
    },
  },
};
</script>

<template>
  <div>
    <gl-form-group
      :label="s__('JiraService|View Jira issues in GitLab')"
      label-for="jira-issue-settings"
    >
      <div id="jira-issue-settings">
        <p>
          {{
            s__(
              'JiraService|Work on Jira issues without leaving GitLab. Adds a Jira menu to access your list of Jira issues and view any issue as read-only.',
            )
          }}
        </p>
        <template v-if="showJiraIssuesIntegration">
          <input name="service[issues_enabled]" type="hidden" :value="enableJiraIssues || false" />
          <gl-form-checkbox v-model="enableJiraIssues">
            {{ s__('JiraService|Enable Jira issues') }}
            <template #help>
              {{
                s__(
                  'JiraService|Warning: All GitLab users that have access to this GitLab project will be able to view all issues from the Jira project specified below.',
                )
              }}
            </template>
          </gl-form-checkbox>
          <jira-issue-creation-vulnerabilities
            v-if="showJiraVulnerabilitiesOptions"
            :project-key="projectKey"
            :initial-is-enabled="initialEnableJiraVulnerabilities"
            :initial-issue-type-id="initialVulnerabilitiesIssuetype"
            data-testid="jira-for-vulnerabilities"
            @request-get-issue-types="getJiraIssueTypes"
          />
        </template>
        <gl-card v-else class="gl-mt-7">
          <strong>{{ __('This is a Premium feature') }}</strong>
          <p>{{ __('Upgrade your plan to enable this feature of the Jira Integration.') }}</p>
          <gl-button
            v-if="upgradePlanPath"
            category="primary"
            variant="info"
            :href="upgradePlanPath"
            target="_blank"
          >
            {{ __('Upgrade your plan') }}
          </gl-button>
        </gl-card>
      </div>
    </gl-form-group>
    <template v-if="showJiraIssuesIntegration">
      <gl-form-group
        :label="s__('JiraService|Jira project key')"
        label-for="service_project_key"
        :invalid-feedback="__('This field is required.')"
        :state="validProjectKey"
      >
        <gl-form-input
          id="service_project_key"
          v-model="projectKey"
          name="service[project_key]"
          :placeholder="s__('JiraService|e.g. AB')"
          :required="enableJiraIssues"
          :state="validProjectKey"
          :disabled="!enableJiraIssues"
        />
      </gl-form-group>
      <p v-if="gitlabIssuesEnabled">
        <gl-sprintf
          :message="
            s__(
              'JiraService|Displaying Jira issues while leaving the GitLab issue functionality enabled might be confusing. Consider %{linkStart}disabling GitLab issues%{linkEnd} if they won’t otherwise be used.',
            )
          "
        >
          <template #link="{ content }">
            <gl-link :href="editProjectPath" target="_blank">{{ content }}</gl-link>
          </template>
        </gl-sprintf>
      </p>
    </template>
  </div>
</template>
