<script>
import { GlButton, GlPopover, GlSprintf } from '@gitlab/ui';
import { GlBreakpointInstance as bp } from '@gitlab/ui/dist/utils';
import { debounce } from 'lodash';
import { formatDate } from '~/lib/utils/datetime_utility';
import { s__ } from '~/locale';

const RESIZE_EVENT_DEBOUNCE_MS = 150;

export default {
  components: {
    GlButton,
    GlPopover,
    GlSprintf,
  },
  props: {
    containerId: {
      type: [String, null],
      required: false,
      default: null,
    },
    groupName: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    plansHref: {
      type: String,
      required: true,
    },
    purchaseHref: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    trialEndDate: {
      type: Date,
      required: true,
    },
  },
  data: () => ({
    disabled: false,
  }),
  i18n: {
    compareAllButtonTitle: s__('Trials|Compare all plans'),
    popoverTitle: s__('Trials|Hey there'),
    popoverContent: s__(`Trials|Your trial ends on
      %{boldStart}%{trialEndDate}%{boldEnd}. We hope you are enjoying GitLab
      %{planName}. To continue using GitLab %{planName} after your trial ends,
      you will need to buy a subscription. You can also choose GitLab Premium
      if its features are sufficient for your needs.`),
    upgradeButtonTitle: s__('Trials|Upgrade %{groupName} to %{planName}'),
  },
  computed: {
    formattedTrialEndDate() {
      return formatDate(this.trialEndDate, 'yyyy-mm-dd');
    },
  },
  created() {
    this.debouncedResize = debounce(() => this.onResize(), RESIZE_EVENT_DEBOUNCE_MS);
    window.addEventListener('resize', this.debouncedResize);
  },
  mounted() {
    this.onResize();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.debouncedResize);
  },
  methods: {
    onResize() {
      this.updateDisabledState();
    },
    updateDisabledState() {
      this.disabled = ['xs', 'sm'].includes(bp.getBreakpointSize());
    },
  },
};
</script>

<template>
  <gl-popover
    :container="containerId"
    :target="targetId"
    :disabled="disabled"
    triggers="hover focus"
    placement="rightbottom"
    boundary="viewport"
    :delay="{ hide: 400 }"
  >
    <template #title>
      {{ $options.i18n.popoverTitle }}
      <gl-emoji class="gl-vertical-align-baseline font-size-inherit gl-ml-1" data-name="wave" />
    </template>

    <gl-sprintf :message="$options.i18n.popoverContent">
      <template #bold="{ content }">
        <b>{{ sprintf(content, { trialEndDate: formattedTrialEndDate }) }}</b>
      </template>
      <template #planName>{{ planName }}</template>
    </gl-sprintf>

    <div class="gl-mt-5">
      <gl-button
        :href="purchaseHref"
        category="primary"
        variant="confirm"
        size="small"
        class="gl-mb-0"
        block
      >
        <span class="gl-font-sm">
          <gl-sprintf :message="$options.i18n.upgradeButtonTitle">
            <template #groupName>{{ groupName }}</template>
            <template #planName>{{ planName }}</template>
          </gl-sprintf>
        </span>
      </gl-button>
      <gl-button
        :href="plansHref"
        category="secondary"
        variant="confirm"
        size="small"
        class="gl-mb-0"
        block
        :title="$options.i18n.compareAllButtonTitle"
      >
        <span class="gl-font-sm">{{ $options.i18n.compareAllButtonTitle }}</span>
      </gl-button>
    </div>
  </gl-popover>
</template>
