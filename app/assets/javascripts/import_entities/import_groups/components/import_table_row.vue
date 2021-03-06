<script>
import {
  GlButton,
  GlDropdown,
  GlDropdownDivider,
  GlDropdownItem,
  GlDropdownSectionHeader,
  GlIcon,
  GlLink,
  GlFormInput,
} from '@gitlab/ui';
import { joinPaths } from '~/lib/utils/url_utility';
import ImportStatus from '../../components/import_status.vue';
import { STATUSES } from '../../constants';
import groupQuery from '../graphql/queries/group.query.graphql';

const DEBOUNCE_INTERVAL = 300;

export default {
  components: {
    ImportStatus,
    GlButton,
    GlDropdown,
    GlDropdownDivider,
    GlDropdownItem,
    GlDropdownSectionHeader,
    GlLink,
    GlIcon,
    GlFormInput,
  },
  props: {
    group: {
      type: Object,
      required: true,
    },
    availableNamespaces: {
      type: Array,
      required: true,
    },
    groupPathRegex: {
      type: RegExp,
      required: true,
    },
  },

  apollo: {
    existingGroup: {
      query: groupQuery,
      debounce: DEBOUNCE_INTERVAL,
      variables() {
        return {
          fullPath: this.fullPath,
        };
      },
      skip() {
        return !this.isNameValid || this.isAlreadyImported;
      },
    },
  },

  computed: {
    importTarget() {
      return this.group.import_target;
    },

    isInvalid() {
      return Boolean(!this.isNameValid || this.existingGroup);
    },

    isNameValid() {
      return this.groupPathRegex.test(this.importTarget.new_name);
    },

    isAlreadyImported() {
      return this.group.status !== STATUSES.NONE;
    },

    isFinished() {
      return this.group.status === STATUSES.FINISHED;
    },

    fullPath() {
      return `${this.importTarget.target_namespace}/${this.importTarget.new_name}`;
    },

    absolutePath() {
      return joinPaths(gon.relative_url_root || '/', this.fullPath);
    },
  },
};
</script>

<template>
  <tr class="gl-border-gray-200 gl-border-0 gl-border-b-1 gl-border-solid">
    <td class="gl-p-4">
      <gl-link
        :href="group.web_url"
        target="_blank"
        class="gl-display-flex gl-align-items-center gl-h-7"
      >
        {{ group.full_path }} <gl-icon name="external-link" />
      </gl-link>
    </td>
    <td class="gl-p-4">
      <gl-link
        v-if="isFinished"
        class="gl-display-flex gl-align-items-center gl-h-7"
        :href="absolutePath"
      >
        {{ fullPath }}
      </gl-link>

      <div
        v-else
        class="import-entities-target-select gl-display-flex gl-align-items-stretch"
        :class="{
          disabled: isAlreadyImported,
        }"
      >
        <gl-dropdown
          :text="importTarget.target_namespace"
          :disabled="isAlreadyImported"
          toggle-class="gl-rounded-top-right-none! gl-rounded-bottom-right-none!"
          class="import-entities-namespace-dropdown gl-h-7 gl-flex-fill-1"
        >
          <gl-dropdown-item @click="$emit('update-target-namespace', '')">{{
            s__('BulkImport|No parent')
          }}</gl-dropdown-item>
          <template v-if="availableNamespaces.length">
            <gl-dropdown-divider />
            <gl-dropdown-section-header>
              {{ s__('BulkImport|Existing groups') }}
            </gl-dropdown-section-header>
            <gl-dropdown-item
              v-for="ns in availableNamespaces"
              :key="ns.full_path"
              @click="$emit('update-target-namespace', ns.full_path)"
            >
              {{ ns.full_path }}
            </gl-dropdown-item>
          </template>
        </gl-dropdown>
        <div
          class="import-entities-target-select-separator gl-h-7 gl-px-3 gl-display-flex gl-align-items-center gl-border-solid gl-border-0 gl-border-t-1 gl-border-b-1"
        >
          /
        </div>
        <div class="gl-flex-fill-1">
          <gl-form-input
            class="gl-rounded-top-left-none gl-rounded-bottom-left-none"
            :class="{ 'is-invalid': isInvalid && !isAlreadyImported }"
            :disabled="isAlreadyImported"
            :value="importTarget.new_name"
            @input="$emit('update-new-name', $event)"
          />
          <p v-if="isInvalid" class="gl-text-red-500 gl-m-0 gl-mt-2">
            <template v-if="!isNameValid">
              {{ __('Please choose a group URL with no special characters.') }}
            </template>
            <template v-else-if="existingGroup">
              {{ s__('BulkImport|Name already exists.') }}
            </template>
          </p>
        </div>
      </div>
    </td>
    <td class="gl-p-4 gl-white-space-nowrap">
      <import-status :status="group.status" />
    </td>
    <td class="gl-p-4">
      <gl-button
        v-if="!isAlreadyImported"
        :disabled="isInvalid"
        variant="success"
        category="secondary"
        @click="$emit('import-group')"
        >{{ __('Import') }}</gl-button
      >
    </td>
  </tr>
</template>
