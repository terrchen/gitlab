<script>
import { GlIcon } from '@gitlab/ui';
import { mapState } from 'vuex';
import DropdownButton from '~/vue_shared/components/dropdown/dropdown_button.vue';

const EMPTY_LABEL = '-';

export default {
  components: {
    GlIcon,
    DropdownButton,
  },
  props: {
    showMergeRequests: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  computed: {
    ...mapState(['currentBranchId', 'currentMergeRequestId']),
    mergeRequestLabel() {
      return this.currentMergeRequestId ? `!${this.currentMergeRequestId}` : EMPTY_LABEL;
    },
    branchLabel() {
      return this.currentBranchId || EMPTY_LABEL;
    },
  },
};
</script>

<template>
  <dropdown-button>
    <span class="row flex-nowrap">
      <span class="col-auto flex-fill text-truncate">
        <gl-icon :size="16" :aria-label="__('Current Branch')" name="branch" /> {{ branchLabel }}
      </span>
      <span v-if="showMergeRequests" class="col-5 pl-0 text-truncate">
        <gl-icon :size="16" :aria-label="__('Merge Request')" name="merge-request" />
        {{ mergeRequestLabel }}
      </span>
    </span>
  </dropdown-button>
</template>
