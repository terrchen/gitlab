<script>
import { mapState, mapActions } from 'vuex';
import { __, s__ } from '~/locale';
import RegistrySearch from '~/vue_shared/components/registry/registry_search.vue';
import getTableHeaders from '../utils';
import PackageTypeToken from './tokens/package_type_token.vue';

export default {
  tokens: [
    {
      type: 'type',
      icon: 'package',
      title: s__('PackageRegistry|Type'),
      unique: true,
      token: PackageTypeToken,
      operators: [{ value: '=', description: __('is'), default: 'true' }],
    },
  ],
  components: { RegistrySearch },
  computed: {
    ...mapState({
      isGroupPage: (state) => state.config.isGroupPage,
      sorting: (state) => state.sorting,
      filter: (state) => state.filter,
    }),
    sortableFields() {
      return getTableHeaders(this.isGroupPage);
    },
  },
  methods: {
    ...mapActions(['setSorting', 'setFilter']),
    updateSorting(newValue) {
      this.setSorting(newValue);
      this.$emit('update');
    },
  },
};
</script>

<template>
  <registry-search
    :filter="filter"
    :sorting="sorting"
    :tokens="$options.tokens"
    :sortable-fields="sortableFields"
    @sorting:changed="updateSorting"
    @filter:changed="setFilter"
    @filter:submit="$emit('update')"
  />
</template>
