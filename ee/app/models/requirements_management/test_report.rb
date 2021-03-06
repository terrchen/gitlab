# frozen_string_literal: true

module RequirementsManagement
  class TestReport < ApplicationRecord
    include Sortable
    include BulkInsertSafe

    belongs_to :requirement, inverse_of: :test_reports
    belongs_to :author, inverse_of: :test_reports, class_name: 'User'
    belongs_to :build, class_name: 'Ci::Build'

    validates :requirement, :state, presence: true

    enum state: { passed: 1, failed: 2 }

    scope :without_build, -> { where(build_id: nil) }
    scope :with_build, -> { where.not(build_id: nil) }
    scope :for_user_build, ->(user_id, build_id) { where(author_id: user_id, build_id: build_id) }

    class << self
      def persist_requirement_reports(build, ci_report)
        timestamp = Time.current

        reports = if ci_report.all_passed?
                    passed_reports_for_all_requirements(build, timestamp)
                  else
                    individual_reports(build, ci_report, timestamp)
                  end

        bulk_insert!(reports)
      end

      def build_report(author: nil, state:, requirement:, build: nil, timestamp: Time.current)
        new(
          requirement_id: requirement.id,
          build_id: build&.id,
          author_id: build&.user_id || author&.id,
          created_at: timestamp,
          state: state
        )
      end

      private

      def passed_reports_for_all_requirements(build, timestamp)
        [].tap do |reports|
          build.project.requirements.opened.select(:id).find_each do |requirement|
            reports << build_report(state: :passed, requirement: requirement, build: build, timestamp: timestamp)
          end
        end
      end

      def individual_reports(build, ci_report, timestamp)
        [].tap do |reports|
          iids = ci_report.requirements.keys
          break [] if iids.empty?

          build.project.requirements.opened.select(:id, :iid).where(iid: iids).each do |requirement|
            # ignore anything with any unexpected state
            new_state = ci_report.requirements[requirement.iid.to_s]
            next unless states.key?(new_state)

            reports << build_report(state: new_state, requirement: requirement, build: build, timestamp: timestamp)
          end
        end
      end
    end
  end
end
