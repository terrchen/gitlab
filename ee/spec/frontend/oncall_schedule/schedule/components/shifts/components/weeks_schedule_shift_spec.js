import { shallowMount } from '@vue/test-utils';
import RotationsAssignee from 'ee/oncall_schedules/components/rotations/components/rotation_assignee.vue';
import WeeksScheduleShift from 'ee/oncall_schedules/components/schedule/components/shifts/components/weeks_schedule_shift.vue';
import { PRESET_TYPES, DAYS_IN_WEEK } from 'ee/oncall_schedules/constants';
import { nDaysAfter } from '~/lib/utils/datetime_utility';

const shift = {
  participant: {
    id: '1',
    user: {
      username: 'nora.schaden',
    },
  },
  startsAt: '2021-01-12T10:04:56.333Z',
  endsAt: '2021-01-15T10:04:56.333Z',
};

const CELL_WIDTH = 50;
const timeframeItem = new Date(2021, 0, 13);
const timeframe = [timeframeItem, new Date(nDaysAfter(timeframeItem, DAYS_IN_WEEK))];

describe('ee/oncall_schedules/components/schedule/components/shifts/components/weeks_schedule_shift.vue', () => {
  let wrapper;

  function createComponent({ props = {} } = {}) {
    wrapper = shallowMount(WeeksScheduleShift, {
      propsData: {
        shift,
        shiftIndex: 0,
        timeframeItem,
        timeframe,
        presetType: PRESET_TYPES.WEEKS,
        shiftTimeUnitWidth: CELL_WIDTH,
        rotationLength: { lengthUnit: 'DAYS' },
        ...props,
      },
    });
  }

  beforeEach(() => {
    createComponent();
  });

  afterEach(() => {
    wrapper.destroy();
  });

  const findRotationAssignee = () => wrapper.findComponent(RotationsAssignee);

  describe('shift overlaps inside the current time-frame with a shift greater than 24 hours', () => {
    it('should render a rotation assignee child component', () => {
      expect(findRotationAssignee().exists()).toBe(true);
    });

    it('calculates the correct rotation assignee styles when the shift starts at the beginning of the time-frame cell', () => {
      /**
       * Where left should be 0px i.e. beginning of time-frame cell
       * and width should be overlapping days * CELL_WIDTH - ASSIGNEE_SPACER((3 * 50) - 2)
       */
      createComponent({ data: { shiftTimeUnitWidth: CELL_WIDTH } });
      expect(findRotationAssignee().props('rotationAssigneeStyle')).toEqual({
        left: '0px',
        width: '98px',
      });
    });

    it('calculates the correct rotation assignee styles when the shift does not start at the beginning of the time-frame cell', () => {
      /**
       * Where left should be 52x i.e. ((DAYS_IN_WEEK - (timeframeEndsAt - overlapStartDate)) * CELL_WIDTH)(((7 - (20 - 14)) * 50))
       * and width should be overlapping (days * CELL_WIDTH) - ASSIGNEE_SPACER((4 * 50) - 2)
       */
      createComponent({
        props: {
          shift: {
            ...shift,
            startsAt: '2021-01-14T10:04:56.333Z',
            endsAt: '2021-01-18T10:04:56.333Z',
          },
        },
        data: { shiftTimeUnitWidth: CELL_WIDTH },
      });
      expect(findRotationAssignee().props('rotationAssigneeStyle')).toEqual({
        left: '50px',
        width: '198px',
      });
    });
  });

  describe('shift overlaps inside the current time-frame with a shift equal to 24 hours', () => {
    beforeEach(() => {
      createComponent({
        props: { shift: { ...shift, startsAt: '2021-01-14T10:04:56.333Z' } },
        data: { shiftTimeUnitWidth: CELL_WIDTH },
      });
    });

    it('should render a rotation assignee child component', () => {
      expect(findRotationAssignee().exists()).toBe(true);
    });

    it('calculates the correct rotation assignee styles when the shift does not start at the beginning of the time-frame cell', () => {
      /**
       * Where left should be ((DAYS_IN_WEEK - (timeframeEndsAt - overlapStartDate)) * CELL_WIDTH)(((7 - (20 - 14)) * 50))
       * and width should be (overlappingDays * CELL_WIDTH) - ASSIGNEE_SPACER((1 * 50) - 2)
       */
      expect(findRotationAssignee().props('rotationAssigneeStyle')).toEqual({
        left: '50px',
        width: '48px',
      });
    });
  });

  describe('shift overlaps inside the current time-frame with a shift less than 24 hours', () => {
    beforeEach(() => {
      createComponent({
        props: {
          shift: {
            ...shift,
            startsAt: '2021-01-14T10:04:56.333Z',
            endsAt: '2021-01-14T12:04:56.333Z',
          },
          rotationLength: { lengthUnit: 'HOURS' },
        },
        data: { shiftTimeUnitWidth: CELL_WIDTH },
      });
    });

    it('should render a rotation assignee child component', () => {
      expect(findRotationAssignee().exists()).toBe(true);
    });

    it('calculates the correct rotation assignee styles when the shift does not start at the beginning of the time-frame cell', () => {
      /**
       * Where left should be 70px i.e. ((CELL_WIDTH / HOURS_IN_DAY) * overlapStartDate + dayOffSet)(50 / 24 * 10) + 50;
       * and width should be 2px ((CELL_WIDTH / HOURS_IN_DAY) * hoursOverlap - ASSIGNEE_SPACER) (((50 / 24) * 2) - 2)
       */
      expect(findRotationAssignee().props('rotationAssigneeStyle')).toEqual({
        left: '70px',
        width: '2px',
      });
    });
  });
});
