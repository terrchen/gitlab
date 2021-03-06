<script>
import { GlIcon, GlBadge, GlFormInput, GlButton, GlLink } from '@gitlab/ui';
import { mapState, mapGetters, mapActions } from 'vuex';
import { __ } from '~/locale';
import Select2Select from '~/vue_shared/components/select2_select.vue';
import ImportStatus from '../../components/import_status.vue';
import { STATUSES } from '../../constants';
import { isProjectImportable, isIncompatible, getImportStatus } from '../utils';

export default {
  name: 'ProviderRepoTableRow',
  components: {
    Select2Select,
    ImportStatus,
    GlFormInput,
    GlButton,
    GlIcon,
    GlBadge,
    GlLink,
  },
  props: {
    repo: {
      type: Object,
      required: true,
    },
    availableNamespaces: {
      type: Array,
      required: true,
    },
  },

  computed: {
    ...mapState(['ciCdOnly']),
    ...mapGetters(['getImportTarget']),

    displayFullPath() {
      return this.repo.importedProject.fullPath.replace(/^\//, '');
    },

    isFinished() {
      return this.repo.importedProject?.importStatus === STATUSES.FINISHED;
    },

    isImportNotStarted() {
      return isProjectImportable(this.repo);
    },

    isIncompatible() {
      return isIncompatible(this.repo);
    },

    importStatus() {
      return getImportStatus(this.repo);
    },

    importTarget() {
      return this.getImportTarget(this.repo.importSource.id);
    },

    importButtonText() {
      return this.ciCdOnly ? __('Connect') : __('Import');
    },

    select2Options() {
      return {
        data: this.availableNamespaces,
        containerCssClass: 'import-namespace-select qa-project-namespace-select gl-w-auto',
      };
    },

    targetNamespaceSelect: {
      get() {
        return this.importTarget.targetNamespace;
      },
      set(value) {
        this.updateImportTarget({ targetNamespace: value });
      },
    },

    newNameInput: {
      get() {
        return this.importTarget.newName;
      },
      set(value) {
        this.updateImportTarget({ newName: value });
      },
    },
  },

  methods: {
    ...mapActions(['fetchImport', 'setImportTarget']),
    updateImportTarget(changedValues) {
      this.setImportTarget({
        repoId: this.repo.importSource.id,
        importTarget: { ...this.importTarget, ...changedValues },
      });
    },
  },
};
</script>

<template>
  <tr
    class="qa-project-import-row gl-h-11 gl-border-0 gl-border-solid gl-border-t-1 gl-border-gray-100 gl-h-11"
  >
    <td class="gl-p-4">
      <gl-link :href="repo.importSource.providerLink" target="_blank" data-testid="providerLink"
        >{{ repo.importSource.fullName }}
        <gl-icon v-if="repo.importSource.providerLink" name="external-link" />
      </gl-link>
    </td>
    <td
      class="gl-display-flex gl-flex-sm-wrap gl-p-4 gl-pt-5 gl-vertical-align-top"
      data-testid="fullPath"
    >
      <template v-if="repo.importSource.target">{{ repo.importSource.target }}</template>
      <template v-else-if="isImportNotStarted">
        <div class="import-entities-target-select gl-display-flex gl-align-items-stretch gl-w-full">
          <select2-select v-model="targetNamespaceSelect" :options="select2Options" />
          <div
            class="import-entities-target-select-separator gl-px-3 gl-display-flex gl-align-items-center gl-border-solid gl-border-0 gl-border-t-1 gl-border-b-1"
          >
            /
          </div>
          <gl-form-input
            v-model="newNameInput"
            class="gl-rounded-top-left-none gl-rounded-bottom-left-none qa-project-path-field"
          />
        </div>
      </template>
      <template v-else-if="repo.importedProject">{{ displayFullPath }}</template>
    </td>
    <td class="gl-p-4">
      <import-status :status="importStatus" />
    </td>
    <td data-testid="actions">
      <gl-button
        v-if="isFinished"
        class="btn btn-default"
        :href="repo.importedProject.fullPath"
        rel="noreferrer noopener"
        target="_blank"
        >{{ __('Go to project') }}
      </gl-button>
      <gl-button
        v-if="isImportNotStarted"
        type="button"
        class="qa-import-button"
        @click="fetchImport(repo.importSource.id)"
      >
        {{ importButtonText }}
      </gl-button>
      <gl-badge v-else-if="isIncompatible" variant="danger">{{
        __('Incompatible project')
      }}</gl-badge>
    </td>
  </tr>
</template>
