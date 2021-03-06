import { GlIcon, GlLink, GlLoadingIcon, GlSprintf } from '@gitlab/ui';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueApollo from 'vue-apollo';
import createMockApollo from 'helpers/mock_apollo_helper';
import waitForPromises from 'helpers/wait_for_promises';
import PipelineStatus, { i18n } from '~/pipeline_editor/components/header/pipeline_status.vue';
import CiIcon from '~/vue_shared/components/ci_icon.vue';
import { mockCommitSha, mockProjectPipeline, mockProjectFullPath } from '../../mock_data';

const localVue = createLocalVue();
localVue.use(VueApollo);

const mockProvide = {
  projectFullPath: mockProjectFullPath,
};

describe('Pipeline Status', () => {
  let wrapper;
  let mockApollo;
  let mockPipelineQuery;

  const createComponent = ({ hasPipeline = true, isQueryLoading = false }) => {
    const pipeline = hasPipeline
      ? { loading: isQueryLoading, ...mockProjectPipeline.pipeline }
      : { loading: isQueryLoading };

    wrapper = shallowMount(PipelineStatus, {
      provide: mockProvide,
      stubs: { GlLink, GlSprintf },
      data: () => (hasPipeline ? { pipeline } : {}),
      mocks: {
        $apollo: {
          queries: {
            pipeline,
          },
        },
      },
    });
  };

  const createComponentWithApollo = () => {
    const resolvers = {
      Query: {
        project: mockPipelineQuery,
      },
    };
    mockApollo = createMockApollo([], resolvers);

    wrapper = shallowMount(PipelineStatus, {
      localVue,
      apolloProvider: mockApollo,
      provide: mockProvide,
      stubs: { GlLink, GlSprintf },
      data() {
        return {
          commitSha: mockCommitSha,
        };
      },
    });
  };

  const findIcon = () => wrapper.findComponent(GlIcon);
  const findCiIcon = () => wrapper.findComponent(CiIcon);
  const findLoadingIcon = () => wrapper.findComponent(GlLoadingIcon);
  const findPipelineId = () => wrapper.find('[data-testid="pipeline-id"]');
  const findPipelineCommit = () => wrapper.find('[data-testid="pipeline-commit"]');
  const findPipelineErrorMsg = () => wrapper.find('[data-testid="pipeline-error-msg"]');
  const findPipelineLoadingMsg = () => wrapper.find('[data-testid="pipeline-loading-msg"]');

  beforeEach(() => {
    mockPipelineQuery = jest.fn();
  });

  afterEach(() => {
    mockPipelineQuery.mockReset();

    wrapper.destroy();
    wrapper = null;
  });

  describe('while querying', () => {
    it('renders loading icon', () => {
      createComponent({ isQueryLoading: true, hasPipeline: false });

      expect(findLoadingIcon().exists()).toBe(true);
      expect(findPipelineLoadingMsg().text()).toBe(i18n.fetchLoading);
    });

    it('does not render loading icon if pipeline data is already set', () => {
      createComponent({ isQueryLoading: true });

      expect(findLoadingIcon().exists()).toBe(false);
    });
  });

  describe('when querying data', () => {
    describe('when data is set', () => {
      beforeEach(async () => {
        mockPipelineQuery.mockResolvedValue(mockProjectPipeline);

        createComponentWithApollo();
        await waitForPromises();
      });

      it('query is called with correct variables', async () => {
        expect(mockPipelineQuery).toHaveBeenCalledTimes(1);
        expect(mockPipelineQuery).toHaveBeenCalledWith(
          expect.anything(),
          {
            fullPath: mockProjectFullPath,
          },
          expect.anything(),
          expect.anything(),
        );
      });

      it('does not render error', () => {
        expect(findIcon().exists()).toBe(false);
      });

      it('renders pipeline data', () => {
        const { id } = mockProjectPipeline.pipeline;

        expect(findCiIcon().exists()).toBe(true);
        expect(findPipelineId().text()).toBe(`#${id.match(/\d+/g)[0]}`);
        expect(findPipelineCommit().text()).toBe(mockCommitSha);
      });
    });

    describe('when data cannot be fetched', () => {
      beforeEach(async () => {
        mockPipelineQuery.mockRejectedValue(new Error());

        createComponentWithApollo();
        await waitForPromises();
      });

      it('renders error', () => {
        expect(findIcon().attributes('name')).toBe('warning-solid');
        expect(findPipelineErrorMsg().text()).toBe(i18n.fetchError);
      });

      it('does not render pipeline data', () => {
        expect(findCiIcon().exists()).toBe(false);
        expect(findPipelineId().exists()).toBe(false);
        expect(findPipelineCommit().exists()).toBe(false);
      });
    });
  });
});
