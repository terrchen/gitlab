# frozen_string_literal: true

module IncidentManagement
  module OncallRotations
    class PersistAllRotationsShiftsJob
      include ApplicationWorker

      idempotent!
      feature_category :incident_management
      queue_namespace :cronjob

      def perform
        IncidentManagement::OncallRotation.started.pluck(:id).each do |rotation_id| # rubocop: disable CodeReuse/ActiveRecord
          IncidentManagement::OncallRotations::PersistShiftsJob.perform_async(rotation_id)
        end
      end
    end
  end
end
