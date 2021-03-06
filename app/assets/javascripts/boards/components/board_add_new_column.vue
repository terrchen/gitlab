<script>
import {
  GlFormRadio,
  GlFormRadioGroup,
  GlLabel,
  GlTooltipDirective as GlTooltip,
} from '@gitlab/ui';
import { mapActions, mapGetters, mapState } from 'vuex';
import BoardAddNewColumnForm from '~/boards/components/board_add_new_column_form.vue';
import { ListType } from '~/boards/constants';
import boardsStore from '~/boards/stores/boards_store';
import { getIdFromGraphQLId } from '~/graphql_shared/utils';
import { isScopedLabel } from '~/lib/utils/common_utils';

export default {
  components: {
    BoardAddNewColumnForm,
    GlFormRadio,
    GlFormRadioGroup,
    GlLabel,
  },
  directives: {
    GlTooltip,
  },
  inject: ['scopedLabelsAvailable'],
  data() {
    return {
      selectedId: null,
    };
  },
  computed: {
    ...mapState(['labels', 'labelsLoading', 'isEpicBoard']),
    ...mapGetters(['getListByLabelId', 'shouldUseGraphQL']),
    selectedLabel() {
      if (!this.selectedId) {
        return null;
      }
      return this.labels.find(({ id }) => id === this.selectedId);
    },
    columnForSelected() {
      return this.getListByLabelId(this.selectedId);
    },
  },
  created() {
    this.filterItems();
  },
  methods: {
    ...mapActions(['createList', 'fetchLabels', 'highlightList', 'setAddColumnFormVisibility']),
    highlight(listId) {
      if (this.shouldUseGraphQL || this.isEpicBoard) {
        this.highlightList(listId);
      } else {
        const list = boardsStore.state.lists.find(({ id }) => id === listId);
        list.highlighted = true;
        setTimeout(() => {
          list.highlighted = false;
        }, 2000);
      }
    },
    addList() {
      if (!this.selectedLabel) {
        return;
      }

      this.setAddColumnFormVisibility(false);

      if (this.columnForSelected) {
        const listId = this.columnForSelected.id;
        this.highlight(listId);
        return;
      }

      if (this.shouldUseGraphQL || this.isEpicBoard) {
        this.createList({ labelId: this.selectedId });
      } else {
        const listObj = {
          labelId: getIdFromGraphQLId(this.selectedId),
          title: this.selectedLabel.title,
          position: boardsStore.state.lists.length - 2,
          list_type: ListType.label,
          label: this.selectedLabel,
        };

        boardsStore.new(listObj);
      }
    },

    filterItems(searchTerm) {
      this.fetchLabels(searchTerm);
    },

    showScopedLabels(label) {
      return this.scopedLabelsAvailable && isScopedLabel(label);
    },
  },
};
</script>

<template>
  <board-add-new-column-form
    :loading="labelsLoading"
    :form-description="__('A label list displays issues with the selected label.')"
    :search-label="__('Select label')"
    :search-placeholder="__('Search labels')"
    :selected-id="selectedId"
    @filter-items="filterItems"
    @add-list="addList"
  >
    <template slot="selected">
      <gl-label
        v-if="selectedLabel"
        v-gl-tooltip
        :title="selectedLabel.title"
        :description="selectedLabel.description"
        :background-color="selectedLabel.color"
        :scoped="showScopedLabels(selectedLabel)"
      />
    </template>

    <template slot="items">
      <gl-form-radio-group v-model="selectedId" class="gl-overflow-y-auto gl-px-5 gl-pt-3">
        <label
          v-for="label in labels"
          :key="label.id"
          class="gl-display-flex gl-flex-align-items-center gl-mb-5 gl-font-weight-normal"
        >
          <gl-form-radio :value="label.id" class="gl-mb-0 gl-mr-3" />
          <span
            class="dropdown-label-box gl-top-0"
            :style="{
              backgroundColor: label.color,
            }"
          ></span>
          <span>{{ label.title }}</span>
        </label>
      </gl-form-radio-group>
    </template>
  </board-add-new-column-form>
</template>
