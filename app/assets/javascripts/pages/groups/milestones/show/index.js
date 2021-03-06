import Milestone from '~/milestone';
import initDeleteMilestoneModal from '~/pages/milestones/shared/delete_milestone_modal_init';
import initMilestonesShow from '~/pages/milestones/shared/init_milestones_show';

document.addEventListener('DOMContentLoaded', () => {
  initMilestonesShow();
  initDeleteMilestoneModal();
  Milestone.initDeprecationMessage();
});
