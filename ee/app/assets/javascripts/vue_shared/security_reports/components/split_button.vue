<script>
import { GlDropdown, GlDropdownItem } from '@gitlab/ui';
import { visitUrl } from '~/lib/utils/url_utility';

export default {
  components: {
    GlDropdown,
    GlDropdownItem,
  },
  props: {
    buttons: {
      type: Array,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data: () => ({
    selectedButton: {},
  }),
  created() {
    this.setButton(this.buttons[0]);
  },
  methods: {
    setButton(button) {
      this.selectedButton = button;
    },
    handleClick() {
      if (this.selectedButton.href) {
        visitUrl(this.selectedButton.href, true);
      } else {
        this.$emit(this.selectedButton.action);
      }
    },
  },
};
</script>

<template>
  <gl-dropdown
    v-if="selectedButton"
    :disabled="disabled"
    variant="success"
    :text="selectedButton.name"
    :href="selectedButton.href"
    split
    @click="handleClick"
  >
    <gl-dropdown-item
      v-for="button in buttons"
      :key="button.action"
      :is-checked="selectedButton === button"
      is-check-item
      @click="setButton(button)"
    >
      <strong>{{ button.name }}</strong>
      <br />
      <span>{{ button.tagline }}</span>
    </gl-dropdown-item>
  </gl-dropdown>
</template>
