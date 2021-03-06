<script>
import {
  GlAccordion,
  GlAccordionItem,
  GlAlert,
  GlButton,
  GlFormGroup,
  GlFormText,
  GlFormCheckbox,
  GlLink,
  GlSprintf,
} from '@gitlab/ui';
import * as Sentry from '@sentry/browser';
import { isEmptyValue } from '~/lib/utils/forms';
import { __, s__ } from '~/locale';
import DropdownInput from '../../components/dropdown_input.vue';
import DynamicFields from '../../components/dynamic_fields.vue';
import FormInput from '../../components/form_input.vue';
import { SCAN_MODES, CONFIGURATION_SNIPPET_MODAL_ID } from '../constants';
import apiFuzzingCiConfigurationCreate from '../graphql/api_fuzzing_ci_configuration_create.mutation.graphql';
import ConfigurationSnippetModal from './configuration_snippet_modal.vue';

export default {
  CONFIGURATION_SNIPPET_MODAL_ID,
  components: {
    GlAccordion,
    GlAccordionItem,
    GlAlert,
    GlButton,
    GlFormGroup,
    GlFormText,
    GlFormCheckbox,
    GlLink,
    GlSprintf,
    ConfigurationSnippetModal,
    DropdownInput,
    DynamicFields,
    FormInput,
  },
  inject: [
    'securityConfigurationPath',
    'fullPath',
    'apiFuzzingAuthenticationDocumentationPath',
    'ciVariablesDocumentationPath',
    'projectCiSettingsPath',
    'canSetProjectCiVariables',
  ],
  props: {
    apiFuzzingCiConfiguration: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isLoading: false,
      showError: false,
      targetUrl: {
        field: 'targetUrl',
        label: s__('APIFuzzing|Target URL'),
        description: s__('APIFuzzing|Base URL of API fuzzing target.'),
        placeholder: __('Ex: Example.com'),
        value: '',
      },
      scanMode: {
        field: 'scanMode',
        label: s__('APIFuzzing|Scan mode'),
        description: s__('APIFuzzing|There are two ways to perform scans.'),
        value: '',
        defaultText: s__('APIFuzzing|Choose a method'),
        options: this.apiFuzzingCiConfiguration.scanModes.map((value) => ({
          value,
          text: SCAN_MODES[value].scanModeLabel,
        })),
      },
      apiSpecificationFile: {
        field: 'apiSpecificationFile',
        value: '',
      },
      authenticationEnabled: false,
      authenticationSettings: [
        {
          type: 'string',
          field: 'username',
          label: s__('APIFuzzing|Username for basic authentication'),
          description: s__(
            'APIFuzzing|Instead of entering the username directly, enter the key of the CI variable set to the username.',
          ),
          placeholder: s__('APIFuzzing|Ex: $TestUsername'),
          value: '',
        },
        {
          type: 'string',
          field: 'password',
          label: s__('APIFuzzing|Password for basic authentication'),
          description: s__(
            'APIFuzzing|Instead of entering the password directly, enter the key of the CI variable set to the password.',
          ),
          placeholder: s__('APIFuzzing|Ex: $TestPassword'),
          value: '',
        },
      ],
      scanProfile: {
        field: 'scanProfile',
        label: s__('APIFuzzing|Scan profile'),
        description: 'Pre-defined profiles by GitLab.',
        value: '',
        defaultText: s__('APIFuzzing|Choose a profile'),
        options: this.apiFuzzingCiConfiguration.scanProfiles.map(
          ({ name: value, description: text }) => ({
            value,
            text,
          }),
        ),
      },
      ciYamlEditPath: '',
      configurationYaml: '',
    };
  },
  computed: {
    authAlertI18n() {
      return this.canSetProjectCiVariables
        ? {
            title: s__('APIFuzzing|Make sure your credentials are secured'),
            text: s__(
              `APIFuzzing|To prevent a security leak, authentication info must be added as a
              %{ciVariablesLinkStart}CI variable%{ciVariablesLinkEnd}. As a user with maintainer access
              rights, you can manage CI variables in the
              %{ciSettingsLinkStart}Settings%{ciSettingsLinkEnd} area.`,
            ),
          }
        : {
            title: s__("APIFuzzing|You may need a maintainer's help to secure your credentials."),
            text: s__(
              `APIFuzzing|To prevent a security leak, authentication info must be added as a
              %{ciVariablesLinkStart}CI variable%{ciVariablesLinkEnd}. A user with maintainer
              access rights can manage CI variables in the
              %{ciSettingsLinkStart}Settings%{ciSettingsLinkEnd} area. We detected that you are not
              a maintainer. Commit your changes and assign them to a maintainer to update the
              credentials before merging.`,
            ),
          };
    },
    scanProfileYaml() {
      return this.apiFuzzingCiConfiguration.scanProfiles.find(
        ({ name }) => name === this.scanProfile.value,
      )?.yaml;
    },
    someFieldEmpty() {
      const fields = [this.targetUrl, this.scanMode, this.apiSpecificationFile, this.scanProfile];
      if (this.authenticationEnabled) {
        fields.push(...this.authenticationSettings);
      }
      return fields.some(({ value }) => isEmptyValue(value));
    },
  },
  methods: {
    async onSubmit() {
      this.isLoading = true;
      this.showError = false;
      try {
        const input = {
          projectPath: this.fullPath,
          target: this.targetUrl.value,
          scanMode: this.scanMode.value,
          apiSpecificationFile: this.apiSpecificationFile.value,
          scanProfile: this.scanProfile.value,
        };
        if (this.authenticationEnabled) {
          const [authUsername, authPassword] = this.authenticationSettings;
          input.authUsername = authUsername.value;
          input.authPassword = authPassword.value;
        }
        const {
          data: {
            apiFuzzingCiConfigurationCreate: {
              gitlabCiYamlEditPath,
              configurationYaml,
              errors = [],
            },
          },
        } = await this.$apollo.mutate({
          mutation: apiFuzzingCiConfigurationCreate,
          variables: { input },
        });
        if (errors.length) {
          this.showError = true;
        } else {
          this.ciYamlEditPath = gitlabCiYamlEditPath;
          this.configurationYaml = configurationYaml;
          this.$refs[CONFIGURATION_SNIPPET_MODAL_ID].show();
        }
      } catch (e) {
        this.showError = true;
        Sentry.captureException(e);
      } finally {
        this.isLoading = false;
      }
    },
    dismissError() {
      this.showError = false;
    },
  },
  SCAN_MODES,
};
</script>

<template>
  <form @submit.prevent="onSubmit">
    <gl-alert v-if="showError" variant="danger" class="gl-mb-5" @dismiss="dismissError">
      {{ s__('APIFuzzing|The configuration could not be saved, please try again later.') }}
    </gl-alert>

    <form-input v-model="targetUrl.value" v-bind="targetUrl" class="gl-mb-7" />

    <dropdown-input v-model="scanMode.value" v-bind="scanMode" />
    <form-input
      v-if="scanMode.value"
      v-model="apiSpecificationFile.value"
      v-bind="{ ...apiSpecificationFile, ...$options.SCAN_MODES[scanMode.value] }"
    />

    <gl-form-group class="gl-my-7">
      <template #label>
        {{ __('Authentication') }}
        <gl-form-text class="gl-mt-3">
          <gl-sprintf
            :message="
              s__(
                'APIFuzzing|Authentication is handled by providing HTTP basic authentication token as a header or cookie. %{linkStart}More information%{linkEnd}.',
              )
            "
          >
            <template #link="{ content }">
              <a :href="apiFuzzingAuthenticationDocumentationPath">
                {{ content }}
              </a>
            </template>
          </gl-sprintf>
        </gl-form-text>
      </template>
      <gl-form-checkbox
        v-model="authenticationEnabled"
        data-testid="api-fuzzing-enable-authentication-checkbox"
      >
        {{ s__('APIFuzzing|Enable authentication') }}
      </gl-form-checkbox>
    </gl-form-group>

    <template v-if="authenticationEnabled">
      <gl-alert
        :title="authAlertI18n.title"
        :dismissible="false"
        variant="warning"
        class="gl-mb-5"
        data-testid="api-fuzzing-authentication-notice"
      >
        <gl-sprintf :message="authAlertI18n.text">
          <template #ciVariablesLink="{ content }">
            <gl-link :href="ciVariablesDocumentationPath" target="_blank">
              {{ content }}
            </gl-link>
          </template>
          <template #ciSettingsLink="{ content }">
            <gl-link :href="projectCiSettingsPath" target="_blank">
              {{ content }}
            </gl-link>
          </template>
        </gl-sprintf>
      </gl-alert>
      <dynamic-fields v-model="authenticationSettings" />
    </template>

    <dropdown-input v-model="scanProfile.value" v-bind="scanProfile" />
    <template v-if="scanProfileYaml">
      <gl-accordion>
        <gl-accordion-item :title="s__('APIFuzzing|Show code snippet for the profile')">
          <pre data-testid="api-fuzzing-scan-profile-yaml-viewer">{{ scanProfileYaml }}</pre>
        </gl-accordion-item>
      </gl-accordion>
    </template>

    <hr />

    <gl-button
      :disabled="someFieldEmpty"
      :loading="isLoading"
      type="submit"
      variant="confirm"
      class="js-no-auto-disable"
      data-testid="api-fuzzing-configuration-submit-button"
      >{{ s__('APIFuzzing|Generate code snippet') }}</gl-button
    >
    <gl-button
      :disabled="isLoading"
      :href="securityConfigurationPath"
      data-testid="api-fuzzing-configuration-cancel-button"
      >{{ __('Cancel') }}</gl-button
    >

    <configuration-snippet-modal
      :ref="$options.CONFIGURATION_SNIPPET_MODAL_ID"
      :ci-yaml-edit-url="ciYamlEditPath"
      :yaml="configurationYaml"
    />
  </form>
</template>
