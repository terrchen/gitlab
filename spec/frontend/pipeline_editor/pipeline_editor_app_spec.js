import { nextTick } from 'vue';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import {
  GlAlert,
  GlButton,
  GlFormInput,
  GlFormTextarea,
  GlLoadingIcon,
  GlTabs,
  GlTab,
} from '@gitlab/ui';
import waitForPromises from 'helpers/wait_for_promises';
import VueApollo from 'vue-apollo';
import createMockApollo from 'jest/helpers/mock_apollo_helper';

import { objectToQuery, redirectTo, refreshCurrentPage } from '~/lib/utils/url_utility';
import {
  mockCiConfigPath,
  mockCiConfigQueryResponse,
  mockCiYml,
  mockCommitId,
  mockCommitMessage,
  mockDefaultBranch,
  mockProjectPath,
  mockNewMergeRequestPath,
} from './mock_data';

import CommitForm from '~/pipeline_editor/components/commit/commit_form.vue';
import getCiConfig from '~/pipeline_editor/graphql/queries/ci_config.graphql';
import PipelineGraph from '~/pipelines/components/pipeline_graph/pipeline_graph.vue';
import PipelineEditorApp from '~/pipeline_editor/pipeline_editor_app.vue';
import TextEditor from '~/pipeline_editor/components/text_editor.vue';

const localVue = createLocalVue();
localVue.use(VueApollo);

jest.mock('~/lib/utils/url_utility', () => ({
  redirectTo: jest.fn(),
  refreshCurrentPage: jest.fn(),
  objectToQuery: jest.requireActual('~/lib/utils/url_utility').objectToQuery,
  mergeUrlParams: jest.requireActual('~/lib/utils/url_utility').mergeUrlParams,
}));

describe('~/pipeline_editor/pipeline_editor_app.vue', () => {
  let wrapper;

  let mockApollo;
  let mockBlobContentData;
  let mockCiConfigData;
  let mockMutate;

  const createComponent = ({
    props = {},
    blobLoading = false,
    lintLoading = false,
    options = {},
    mountFn = shallowMount,
    provide = {
      glFeatures: {
        ciConfigVisualizationTab: true,
      },
    },
  } = {}) => {
    mockMutate = jest.fn().mockResolvedValue({
      data: {
        commitCreate: {
          errors: [],
          commit: {},
        },
      },
    });

    wrapper = mountFn(PipelineEditorApp, {
      propsData: {
        ciConfigPath: mockCiConfigPath,
        commitId: mockCommitId,
        defaultBranch: mockDefaultBranch,
        projectPath: mockProjectPath,
        newMergeRequestPath: mockNewMergeRequestPath,
        ...props,
      },
      provide,
      stubs: {
        GlTabs,
        GlButton,
        CommitForm,
        EditorLite: {
          template: '<div/>',
        },
        TextEditor,
      },
      mocks: {
        $apollo: {
          queries: {
            content: {
              loading: blobLoading,
            },
            ciConfigData: {
              loading: lintLoading,
            },
          },
          mutate: mockMutate,
        },
      },
      // attachToDocument is required for input/submit events
      attachToDocument: mountFn === mount,
      ...options,
    });
  };

  const createComponentWithApollo = ({ props = {}, mountFn = shallowMount } = {}) => {
    const handlers = [[getCiConfig, mockCiConfigData]];
    const resolvers = {
      Query: {
        blobContent() {
          return {
            __typename: 'BlobContent',
            rawData: mockBlobContentData(),
          };
        },
      },
    };

    mockApollo = createMockApollo(handlers, resolvers);

    const options = {
      localVue,
      mocks: {},
      apolloProvider: mockApollo,
    };

    createComponent({ props, options }, mountFn);
  };

  const findLoadingIcon = () => wrapper.find(GlLoadingIcon);
  const findAlert = () => wrapper.find(GlAlert);
  const findBlobFailureAlert = () => wrapper.find(GlAlert);
  const findTabAt = i => wrapper.findAll(GlTab).at(i);
  const findVisualizationTab = () => wrapper.find('[data-testid="visualization-tab"]');
  const findTextEditor = () => wrapper.find(TextEditor);
  const findCommitForm = () => wrapper.find(CommitForm);
  const findPipelineGraph = () => wrapper.find(PipelineGraph);
  const findCommitBtnLoadingIcon = () => wrapper.find('[type="submit"]').find(GlLoadingIcon);

  beforeEach(() => {
    mockBlobContentData = jest.fn();
    mockCiConfigData = jest.fn().mockResolvedValue(mockCiConfigQueryResponse);
  });

  afterEach(() => {
    mockBlobContentData.mockReset();
    mockCiConfigData.mockReset();
    refreshCurrentPage.mockReset();
    redirectTo.mockReset();
    mockMutate.mockReset();

    wrapper.destroy();
    wrapper = null;
  });

  it('displays a loading icon if the blob query is loading', () => {
    createComponent({ blobLoading: true });

    expect(findLoadingIcon().exists()).toBe(true);
    expect(findTextEditor().exists()).toBe(false);
  });

  describe('tabs', () => {
    describe('editor tab', () => {
      beforeEach(() => {
        createComponent();
      });

      it('displays the tab and its content', async () => {
        expect(
          findTabAt(0)
            .find(TextEditor)
            .exists(),
        ).toBe(true);
      });

      it('displays tab lazily, until editor is ready', async () => {
        expect(findTabAt(0).attributes('lazy')).toBe('true');

        findTextEditor().vm.$emit('editor-ready');

        await nextTick();

        expect(findTabAt(0).attributes('lazy')).toBe(undefined);
      });
    });

    describe('visualization tab', () => {
      describe('with feature flag on', () => {
        beforeEach(() => {
          createComponent();
        });

        it('display the tab', () => {
          expect(findVisualizationTab().exists()).toBe(true);
        });

        it('displays a loading icon if the lint query is loading', () => {
          createComponent({ lintLoading: true });

          expect(findLoadingIcon().exists()).toBe(true);
          expect(findPipelineGraph().exists()).toBe(false);
        });
      });

      describe('with feature flag off', () => {
        beforeEach(() => {
          createComponent({ provide: { glFeatures: { ciConfigVisualizationTab: false } } });
        });

        it('does not display the tab', () => {
          expect(findVisualizationTab().exists()).toBe(false);
        });
      });
    });
  });

  describe('when data is set', () => {
    beforeEach(async () => {
      createComponent({ mountFn: mount });

      await wrapper.setData({
        content: mockCiYml,
        contentModel: mockCiYml,
      });
    });

    it('displays content after the query loads', () => {
      expect(findLoadingIcon().exists()).toBe(false);
      expect(findTextEditor().attributes('value')).toBe(mockCiYml);
    });

    describe('commit form', () => {
      const mockVariables = {
        content: mockCiYml,
        filePath: mockCiConfigPath,
        lastCommitId: mockCommitId,
        message: mockCommitMessage,
        projectPath: mockProjectPath,
        startBranch: mockDefaultBranch,
      };

      const findInForm = selector => findCommitForm().find(selector);

      const submitCommit = async ({
        message = mockCommitMessage,
        branch = mockDefaultBranch,
        openMergeRequest = false,
      } = {}) => {
        await findInForm(GlFormTextarea).setValue(message);
        await findInForm(GlFormInput).setValue(branch);
        if (openMergeRequest) {
          await findInForm('[data-testid="new-mr-checkbox"]').setChecked(openMergeRequest);
        }
        await findInForm('[type="submit"]').trigger('click');
      };

      const cancelCommitForm = async () => {
        const findCancelBtn = () => wrapper.find('[type="reset"]');
        await findCancelBtn().trigger('click');
      };

      describe('when the user commits changes to the current branch', () => {
        beforeEach(async () => {
          await submitCommit();
        });

        it('calls the mutation with the default branch', () => {
          expect(mockMutate).toHaveBeenCalledWith({
            mutation: expect.any(Object),
            variables: {
              ...mockVariables,
              branch: mockDefaultBranch,
            },
          });
        });

        it('refreshes the page', () => {
          expect(refreshCurrentPage).toHaveBeenCalled();
        });

        it('shows no saving state', () => {
          expect(findCommitBtnLoadingIcon().exists()).toBe(false);
        });
      });

      describe('when the user commits changes to a new branch', () => {
        const newBranch = 'new-branch';

        beforeEach(async () => {
          await submitCommit({
            branch: newBranch,
          });
        });

        it('calls the mutation with the new branch', () => {
          expect(mockMutate).toHaveBeenCalledWith({
            mutation: expect.any(Object),
            variables: {
              ...mockVariables,
              branch: newBranch,
            },
          });
        });

        it('refreshes the page', () => {
          expect(refreshCurrentPage).toHaveBeenCalledWith();
        });
      });

      describe('when the user commits changes to open a new merge request', () => {
        const newBranch = 'new-branch';

        beforeEach(async () => {
          await submitCommit({
            branch: newBranch,
            openMergeRequest: true,
          });
        });

        it('redirects to the merge request page with source and target branches', () => {
          const branchesQuery = objectToQuery({
            'merge_request[source_branch]': newBranch,
            'merge_request[target_branch]': mockDefaultBranch,
          });

          expect(redirectTo).toHaveBeenCalledWith(`${mockNewMergeRequestPath}?${branchesQuery}`);
        });
      });

      describe('when the commit is ocurring', () => {
        it('shows a saving state', async () => {
          await mockMutate.mockImplementationOnce(() => {
            expect(findCommitBtnLoadingIcon().exists()).toBe(true);
            return Promise.resolve();
          });

          await submitCommit({
            message: mockCommitMessage,
            branch: mockDefaultBranch,
            openMergeRequest: false,
          });
        });
      });

      describe('when the commit fails', () => {
        it('shows a the error message', async () => {
          mockMutate.mockRejectedValueOnce(new Error('commit failed'));

          await submitCommit();

          await waitForPromises();

          expect(findAlert().text()).toMatchInterpolatedText(
            'The GitLab CI configuration could not be updated. commit failed',
          );
        });

        it('shows an unkown error', async () => {
          mockMutate.mockRejectedValueOnce();

          await submitCommit();

          await waitForPromises();

          expect(findAlert().text()).toMatchInterpolatedText(
            'The GitLab CI configuration could not be updated.',
          );
        });
      });

      describe('when the commit form is cancelled', () => {
        const otherContent = 'other content';

        beforeEach(async () => {
          findTextEditor().vm.$emit('input', otherContent);
          await nextTick();
        });

        it('content is restored after cancel is called', async () => {
          await cancelCommitForm();

          expect(findTextEditor().attributes('value')).toBe(mockCiYml);
        });
      });
    });
  });

  describe('displays fetch content errors', () => {
    it('no error is shown when data is set', async () => {
      mockBlobContentData.mockResolvedValue(mockCiYml);
      createComponentWithApollo();

      await waitForPromises();

      expect(findBlobFailureAlert().exists()).toBe(false);
      expect(findTextEditor().attributes('value')).toBe(mockCiYml);
    });

    it('shows a 404 error message', async () => {
      mockBlobContentData.mockRejectedValueOnce({
        response: {
          status: 404,
        },
      });
      createComponentWithApollo();

      await waitForPromises();

      expect(findBlobFailureAlert().text()).toBe(
        'No CI file found in this repository, please add one.',
      );
    });

    it('shows a 400 error message', async () => {
      mockBlobContentData.mockRejectedValueOnce({
        response: {
          status: 400,
        },
      });
      createComponentWithApollo();

      await waitForPromises();

      expect(findBlobFailureAlert().text()).toBe(
        'Repository does not have a default branch, please set one.',
      );
    });

    it('shows a unkown error message', async () => {
      mockBlobContentData.mockRejectedValueOnce(new Error('My error!'));
      createComponentWithApollo();
      await waitForPromises();

      expect(findBlobFailureAlert().text()).toBe(
        'The CI configuration was not loaded, please try again.',
      );
    });
  });
});
