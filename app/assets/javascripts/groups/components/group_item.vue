<script>
/* eslint-disable vue/no-v-html */
import { GlLoadingIcon, GlBadge, GlTooltipDirective } from '@gitlab/ui';
import { visitUrl } from '../../lib/utils/url_utility';
import identicon from '../../vue_shared/components/identicon.vue';
import { VISIBILITY_TYPE_ICON, GROUP_VISIBILITY_TYPE } from '../constants';
import eventHub from '../event_hub';

import itemActions from './item_actions.vue';
import itemCaret from './item_caret.vue';
import itemStats from './item_stats.vue';
import itemStatsValue from './item_stats_value.vue';
import itemTypeIcon from './item_type_icon.vue';

export default {
  directives: {
    GlTooltip: GlTooltipDirective,
  },
  components: {
    GlBadge,
    GlLoadingIcon,
    identicon,
    itemCaret,
    itemTypeIcon,
    itemStats,
    itemStatsValue,
    itemActions,
  },
  props: {
    parentGroup: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    group: {
      type: Object,
      required: true,
    },
    action: {
      type: String,
      required: false,
      default: '',
    },
  },
  computed: {
    groupDomId() {
      return `group-${this.group.id}`;
    },
    rowClass() {
      return {
        'is-open': this.group.isOpen,
        'has-children': this.hasChildren,
        'has-description': this.group.description,
        'being-removed': this.group.isBeingRemoved,
      };
    },
    hasChildren() {
      return this.group.childrenCount > 0;
    },
    hasAvatar() {
      return this.group.avatarUrl !== null;
    },
    isGroup() {
      return this.group.type === 'group';
    },
    isGroupPendingRemoval() {
      return this.group.type === 'group' && this.group.pendingRemoval;
    },
    visibilityIcon() {
      return VISIBILITY_TYPE_ICON[this.group.visibility];
    },
    visibilityTooltip() {
      return GROUP_VISIBILITY_TYPE[this.group.visibility];
    },
    microdata() {
      return this.group.microdata || {};
    },
  },
  methods: {
    onClickRowGroup(e) {
      const NO_EXPAND_CLS = 'no-expand';
      const targetClasses = e.target.classList;
      const parentElClasses = e.target.parentElement.classList;

      if (!(targetClasses.contains(NO_EXPAND_CLS) || parentElClasses.contains(NO_EXPAND_CLS))) {
        if (this.hasChildren) {
          eventHub.$emit(`${this.action}toggleChildren`, this.group);
        } else {
          visitUrl(this.group.relativePath);
        }
      }
    },
  },
};
</script>

<template>
  <li
    :id="groupDomId"
    :class="rowClass"
    class="group-row"
    :itemprop="microdata.itemprop"
    :itemtype="microdata.itemtype"
    :itemscope="microdata.itemscope"
    @click.stop="onClickRowGroup"
  >
    <div
      :class="{ 'project-row-contents': !isGroup }"
      class="group-row-contents d-flex align-items-center py-2 pr-3"
    >
      <div class="folder-toggle-wrap gl-mr-2 d-flex align-items-center">
        <item-caret :is-group-open="group.isOpen" />
        <item-type-icon :item-type="group.type" :is-group-open="group.isOpen" />
      </div>
      <gl-loading-icon
        v-if="group.isChildrenLoading"
        size="lg"
        class="d-none d-sm-inline-flex flex-shrink-0 gl-mr-3"
      />
      <div
        :class="{ 'd-sm-flex': !group.isChildrenLoading }"
        class="avatar-container rect-avatar s32 d-none flex-grow-0 flex-shrink-0"
      >
        <a :href="group.relativePath" class="no-expand">
          <img
            v-if="hasAvatar"
            :src="group.avatarUrl"
            data-testid="group-avatar"
            class="avatar s40"
            :itemprop="microdata.imageItemprop"
          />
          <identicon v-else :entity-id="group.id" :entity-name="group.name" size-class="s40" />
        </a>
      </div>
      <div class="group-text-container d-flex flex-fill align-items-center">
        <div class="group-text flex-grow-1 flex-shrink-1">
          <div class="d-flex align-items-center flex-wrap title namespace-title gl-mr-3">
            <a
              v-gl-tooltip.bottom
              data-testid="group-name"
              :href="group.relativePath"
              :title="group.fullName"
              class="no-expand gl-mt-3 gl-mr-3 gl-text-gray-900!"
              :itemprop="microdata.nameItemprop"
              >{{
                // ending bracket must be by closing tag to prevent
                // link hover text-decoration from over-extending
                group.name
              }}</a
            >
            <item-stats-value
              :icon-name="visibilityIcon"
              :title="visibilityTooltip"
              css-class="item-visibility d-inline-flex align-items-center gl-mt-3 gl-mr-2 text-secondary"
            />
            <span v-if="group.permission" class="user-access-role gl-mt-3">
              {{ group.permission }}
            </span>
          </div>
          <div v-if="group.description" class="description">
            <span
              :itemprop="microdata.descriptionItemprop"
              data-testid="group-description"
              v-html="group.description"
            >
            </span>
          </div>
        </div>
        <div v-if="isGroupPendingRemoval">
          <gl-badge variant="warning">{{ __('pending removal') }}</gl-badge>
        </div>
        <div
          class="metadata align-items-md-center d-flex flex-grow-1 flex-shrink-0 flex-wrap justify-content-md-between"
        >
          <item-actions
            v-if="isGroup"
            :group="group"
            :parent-group="parentGroup"
            :action="action"
          />
          <item-stats :item="group" class="group-stats gl-mt-2 d-none d-md-flex" />
        </div>
      </div>
    </div>
    <group-folder
      v-if="group.isOpen && hasChildren"
      :parent-group="group"
      :groups="group.children"
      :action="action"
    />
  </li>
</template>
