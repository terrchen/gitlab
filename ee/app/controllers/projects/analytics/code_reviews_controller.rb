# frozen_string_literal: true

module Projects
  module Analytics
    class CodeReviewsController < Projects::ApplicationController
      include ::Analytics::UniqueVisitsHelper

      before_action :authorize_read_code_review_analytics!
      before_action do
        push_frontend_feature_flag(:not_issuable_queries, @project, default_enabled: true)
      end

      track_unique_visits :index, target_id: 'p_analytics_code_reviews'

      feature_category :planning_analytics

      def index
      end
    end
  end
end
