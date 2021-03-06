<script>
import {
  GlSprintf,
  GlCard,
  GlButtonGroup,
  GlButton,
  GlModalDirective,
  GlTooltipDirective,
} from '@gitlab/ui';
import * as Sentry from '@sentry/browser';
import { capitalize } from 'lodash';
import {
  formatDate,
  nWeeksBefore,
  nWeeksAfter,
  nDaysBefore,
  nDaysAfter,
} from '~/lib/utils/datetime_utility';
import { s__, __ } from '~/locale';
import { addRotationModalId, editRotationModalId, PRESET_TYPES } from '../constants';
import getShiftsForRotations from '../graphql/queries/get_oncall_schedules_with_rotations_shifts.query.graphql';
import EditScheduleModal from './add_edit_schedule_modal.vue';
import DeleteScheduleModal from './delete_schedule_modal.vue';
import AddEditRotationModal from './rotations/components/add_edit_rotation_modal.vue';
import RotationsListSection from './schedule/components/rotations_list_section.vue';
import ScheduleTimelineSection from './schedule/components/schedule_timeline_section.vue';
import { getTimeframeForWeeksView } from './schedule/utils';

export const i18n = {
  scheduleForTz: s__('OnCallSchedules|On-call schedule for the %{timezone}'),
  editScheduleLabel: s__('OnCallSchedules|Edit schedule'),
  deleteScheduleLabel: s__('OnCallSchedules|Delete schedule'),
  rotationTitle: s__('OnCallSchedules|Rotations'),
  addARotation: s__('OnCallSchedules|Add a rotation'),
  presetTypeLabels: {
    DAYS: s__('OnCallSchedules|1 day'),
    WEEKS: s__('OnCallSchedules|2 weeks'),
  },
};
export const editScheduleModalId = 'editScheduleModal';
export const deleteScheduleModalId = 'deleteScheduleModal';

export default {
  i18n,
  addRotationModalId,
  editRotationModalId,
  editScheduleModalId,
  deleteScheduleModalId,
  PRESET_TYPES,
  components: {
    GlButton,
    GlButtonGroup,
    GlCard,
    GlSprintf,
    AddEditRotationModal,
    DeleteScheduleModal,
    EditScheduleModal,
    RotationsListSection,
    ScheduleTimelineSection,
  },
  directives: {
    GlModal: GlModalDirective,
    GlTooltip: GlTooltipDirective,
  },
  inject: ['projectPath', 'timezones'],
  props: {
    schedule: {
      type: Object,
      required: true,
    },
  },
  apollo: {
    rotations: {
      query: getShiftsForRotations,
      variables() {
        this.timeframeStartDate.setHours(1, 0, 0, 0);
        const startsAt = this.timeframeStartDate;
        const endsAt = nWeeksAfter(startsAt, 2);

        return {
          projectPath: this.projectPath,
          startsAt,
          endsAt,
        };
      },
      update(data) {
        const nodes = data.project?.incidentManagementOncallSchedules?.nodes ?? [];
        const schedule = nodes.length ? nodes[nodes.length - 1] : null;
        return schedule?.rotations.nodes ?? [];
      },
      error(error) {
        Sentry.captureException(error);
      },
    },
  },
  data() {
    return {
      presetType: this.$options.PRESET_TYPES.WEEKS,
      timeframeStartDate: new Date(),
      rotations: this.schedule.rotations.nodes,
    };
  },
  computed: {
    offset() {
      const selectedTz = this.timezones.find((tz) => tz.identifier === this.schedule.timezone);
      return __(`(UTC ${selectedTz.formatted_offset})`);
    },
    timeframe() {
      return getTimeframeForWeeksView(this.timeframeStartDate);
    },
    scheduleRange() {
      switch (this.presetType) {
        case PRESET_TYPES.DAYS:
          return formatDate(this.timeframe[0], 'mmmm d, yyyy');
        case PRESET_TYPES.WEEKS: {
          const firstDayOfTheLastWeek = this.timeframe[this.timeframe.length - 1];
          const firstDayOfTheNextTimeframe = nWeeksAfter(firstDayOfTheLastWeek, 1);
          const lastDayOfTimeframe = nDaysBefore(firstDayOfTheNextTimeframe, 1);

          return `${formatDate(this.timeframe[0], 'mmmm d')} - ${formatDate(
            lastDayOfTimeframe,
            'mmmm d, yyyy',
          )}`;
        }
        default:
          return '';
      }
    },
    loading() {
      return this.$apollo.queries.rotations.loading;
    },
  },
  methods: {
    switchPresetType(type) {
      this.presetType = type;
      this.timeframeStartDate = new Date();
    },
    formatPresetType(type) {
      return capitalize(type);
    },
    updateToViewPreviousTimeframe() {
      switch (this.presetType) {
        case PRESET_TYPES.DAYS:
          this.timeframeStartDate = nDaysBefore(this.timeframeStartDate, 1);
          break;
        case PRESET_TYPES.WEEKS:
          this.timeframeStartDate = nWeeksBefore(this.timeframeStartDate, 2);
          break;
        default:
          break;
      }
    },
    updateToViewNextTimeframe() {
      switch (this.presetType) {
        case PRESET_TYPES.DAYS:
          this.timeframeStartDate = nDaysAfter(this.timeframeStartDate, 1);
          break;
        case PRESET_TYPES.WEEKS:
          this.timeframeStartDate = nWeeksAfter(this.timeframeStartDate, 2);
          break;
        default:
          break;
      }
    },
    fetchRotationShifts() {
      this.$apollo.queries.rotations.refetch();
    },
  },
};
</script>

<template>
  <div>
    <gl-card class="gl-mt-5" header-class="gl-py-3">
      <template #header>
        <div
          class="gl-display-flex gl-justify-content-space-between gl-align-items-center gl-m-0"
          data-testid="scheduleHeader"
        >
          <span class="gl-font-weight-bold gl-font-lg">{{ schedule.name }}</span>
          <gl-button-group>
            <gl-button
              v-gl-modal="$options.editScheduleModalId"
              v-gl-tooltip
              :title="$options.i18n.editScheduleLabel"
              icon="pencil"
              :aria-label="$options.i18n.editScheduleLabel"
            />
            <gl-button
              v-gl-modal="$options.deleteScheduleModalId"
              v-gl-tooltip
              :title="$options.i18n.deleteScheduleLabel"
              icon="remove"
              :aria-label="$options.i18n.deleteScheduleLabel"
            />
          </gl-button-group>
        </div>
      </template>
      <p class="gl-text-gray-500 gl-mb-3" data-testid="scheduleBody">
        <gl-sprintf :message="$options.i18n.scheduleForTz">
          <template #timezone>{{ schedule.timezone }}</template>
        </gl-sprintf>
        | {{ offset }}
      </p>
      <div class="gl-display-flex gl-justify-content-space-between gl-mb-3">
        <div class="gl-display-flex gl-align-items-center">
          <gl-button-group>
            <gl-button
              data-testid="previous-timeframe-btn"
              icon="chevron-left"
              :disabled="loading"
              @click="updateToViewPreviousTimeframe"
            />
            <gl-button
              data-testid="next-timeframe-btn"
              icon="chevron-right"
              :disabled="loading"
              @click="updateToViewNextTimeframe"
            />
          </gl-button-group>
          <div class="gl-ml-3">{{ scheduleRange }}</div>
        </div>
        <gl-button-group data-testid="shift-preset-change">
          <gl-button
            v-for="type in $options.PRESET_TYPES"
            :key="type"
            :selected="type === presetType"
            :title="formatPresetType(type)"
            @click="switchPresetType(type)"
          >
            {{ $options.i18n.presetTypeLabels[type] }}
          </gl-button>
        </gl-button-group>
      </div>

      <gl-card header-class="gl-bg-transparent">
        <template #header>
          <div
            class="gl-display-flex gl-justify-content-space-between"
            data-testid="rotationsHeader"
          >
            <h6 class="gl-m-0">{{ $options.i18n.rotationTitle }}</h6>
            <gl-button v-gl-modal="$options.addRotationModalId" variant="link"
              >{{ $options.i18n.addARotation }}
            </gl-button>
          </div>
        </template>

        <div class="schedule-shell" data-testid="rotationsBody">
          <schedule-timeline-section :preset-type="presetType" :timeframe="timeframe" />
          <rotations-list-section
            :preset-type="presetType"
            :rotations="rotations"
            :timeframe="timeframe"
            :schedule-iid="schedule.iid"
            :loading="loading"
          />
        </div>
      </gl-card>
    </gl-card>
    <delete-schedule-modal :schedule="schedule" :modal-id="$options.deleteScheduleModalId" />
    <edit-schedule-modal
      :schedule="schedule"
      :modal-id="$options.editScheduleModalId"
      is-edit-mode
    />
    <add-edit-rotation-modal
      :schedule="schedule"
      :modal-id="$options.addRotationModalId"
      @fetchRotationShifts="fetchRotationShifts"
    />
    <add-edit-rotation-modal
      :schedule="schedule"
      :modal-id="$options.editRotationModalId"
      is-edit-mode
    />
  </div>
</template>
