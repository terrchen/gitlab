<script>
import SharedDeleteAction from './shared/shared_delete_action.vue';

export default {
  components: {
    SharedDeleteAction,
  },
  props: {
    username: {
      type: String,
      required: true,
    },
    paths: {
      type: Object,
      required: true,
    },
  },
};
</script>

<template>
  <shared-delete-action modal-type="delete-with-contributions" :username="username" :paths="paths">
    <slot></slot>
  </shared-delete-action>
</template>
