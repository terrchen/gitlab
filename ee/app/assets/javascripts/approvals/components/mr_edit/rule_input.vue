<script>
import { debounce } from 'lodash';
import { mapState, mapActions } from 'vuex';
import { RULE_TYPE_ANY_APPROVER } from '../../constants';

const ANY_RULE_NAME = 'All Members';

export default {
  props: {
    rule: {
      type: Object,
      required: true,
    },
    isMrEdit: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  computed: {
    ...mapState(['settings']),
  },
  created() {
    this.onInputChangeDebounced = debounce((event) => {
      this.onInputChange(event);
    }, 1000);
  },
  methods: {
    ...mapActions(['putRule', 'postRule']),
    onInputChange(event) {
      const { value } = event.target;
      const approvalsRequired = parseInt(value, 10);

      if (this.rule.id) {
        this.putRule({ id: this.rule.id, approvalsRequired });
      } else {
        this.postRule({
          name: ANY_RULE_NAME,
          ruleType: RULE_TYPE_ANY_APPROVER,
          approvalsRequired,
        });
      }
    },
  },
};
</script>

<template>
  <input
    :value="rule.approvalsRequired"
    :disabled="!settings.canEdit"
    class="form-control mw-6em"
    type="number"
    :min="rule.minApprovalsRequired || 0"
    data-qa-selector="approvals_number_field"
    @input="onInputChangeDebounced"
  />
</template>
