<script>
import { GlDropdown, GlDropdownItem } from '@gitlab/ui';
import updateAlertStatusMutation from '~/graphql_shared/mutations/alert_status_update.mutation.graphql';
import { s__ } from '~/locale';
import Tracking from '~/tracking';

export default {
  i18n: {
    UPDATE_ALERT_STATUS_ERROR: s__(
      'AlertManagement|There was an error while updating the status of the alert.',
    ),
    UPDATE_ALERT_STATUS_INSTRUCTION: s__('AlertManagement|Please try again.'),
  },
  statuses: {
    TRIGGERED: s__('AlertManagement|Triggered'),
    ACKNOWLEDGED: s__('AlertManagement|Acknowledged'),
    RESOLVED: s__('AlertManagement|Resolved'),
  },
  components: {
    GlDropdown,
    GlDropdownItem,
  },
  inject: {
    trackAlertStatusUpdateOptions: {
      default: null,
    },
  },
  props: {
    projectPath: {
      type: String,
      required: true,
    },
    alert: {
      type: Object,
      required: true,
    },
    isDropdownShowing: {
      type: Boolean,
      required: false,
    },
    isSidebar: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    dropdownClass() {
      // eslint-disable-next-line no-nested-ternary
      return this.isSidebar ? (this.isDropdownShowing ? 'show' : 'gl-display-none') : '';
    },
  },
  methods: {
    updateAlertStatus(status) {
      this.$emit('handle-updating', true);
      this.$apollo
        .mutate({
          mutation: updateAlertStatusMutation,
          variables: {
            iid: this.alert.iid,
            status: status.toUpperCase(),
            projectPath: this.projectPath,
          },
        })
        .then((resp) => {
          if (this.trackAlertStatusUpdateOptions) {
            this.trackStatusUpdate(status);
          }
          const errors = resp.data?.updateAlertStatus?.errors || [];

          if (errors[0]) {
            this.$emit(
              'alert-error',
              `${this.$options.i18n.UPDATE_ALERT_STATUS_ERROR} ${errors[0]}`,
            );
          }

          this.$emit('hide-dropdown');
        })
        .catch(() => {
          this.$emit(
            'alert-error',
            `${this.$options.i18n.UPDATE_ALERT_STATUS_ERROR} ${this.$options.i18n.UPDATE_ALERT_STATUS_INSTRUCTION}`,
          );
        })
        .finally(() => {
          this.$emit('handle-updating', false);
        });
    },
    trackStatusUpdate(status) {
      const { category, action, label } = this.trackAlertStatusUpdateOptions;
      Tracking.event(category, action, { label, property: status });
    },
  },
};
</script>

<template>
  <div class="dropdown dropdown-menu-selectable" :class="dropdownClass">
    <gl-dropdown
      ref="dropdown"
      right
      :text="$options.statuses[alert.status]"
      class="w-100"
      toggle-class="dropdown-menu-toggle"
      @keydown.esc.native="$emit('hide-dropdown')"
      @hide="$emit('hide-dropdown')"
    >
      <p v-if="isSidebar" class="gl-new-dropdown-header-top" data-testid="dropdown-header">
        {{ s__('AlertManagement|Assign status') }}
      </p>
      <div class="dropdown-content dropdown-body">
        <gl-dropdown-item
          v-for="(label, field) in $options.statuses"
          :key="field"
          data-testid="statusDropdownItem"
          :active="label.toUpperCase() === alert.status"
          :active-class="'is-active'"
          @click="updateAlertStatus(label)"
        >
          {{ label }}
        </gl-dropdown-item>
      </div>
    </gl-dropdown>
  </div>
</template>
