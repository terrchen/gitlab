# frozen_string_literal: true

module Vulnerabilities
  module Statistics
    class AdjustmentWorker # rubocop:disable Scalability/IdempotentWorker
      include ApplicationWorker

      feature_category :vulnerability_management

      def perform(project_ids)
        AdjustmentService.execute(project_ids)
        HistoricalStatistics::AdjustmentService.execute(project_ids)
      end
    end
  end
end
