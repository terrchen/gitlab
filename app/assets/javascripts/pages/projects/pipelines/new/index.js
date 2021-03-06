import $ from 'jquery';
import setupNativeFormVariableList from '~/ci_variable_list/native_form_variable_list';
import NewBranchForm from '~/new_branch_form';
import initNewPipeline from '~/pipeline_new/index';

const el = document.getElementById('js-new-pipeline');

if (el) {
  initNewPipeline();
} else {
  new NewBranchForm($('.js-new-pipeline-form')); // eslint-disable-line no-new

  setupNativeFormVariableList({
    container: $('.js-ci-variable-list-section'),
    formField: 'variables_attributes',
  });
}
