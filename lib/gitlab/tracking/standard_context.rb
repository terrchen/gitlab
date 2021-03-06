# frozen_string_literal: true

module Gitlab
  module Tracking
    class StandardContext
      GITLAB_STANDARD_SCHEMA_URL = 'iglu:com.gitlab/gitlab_standard/jsonschema/1-0-3'.freeze
      GITLAB_RAILS_SOURCE = 'gitlab-rails'.freeze

      def initialize(namespace: nil, project: nil, user: nil, **data)
        @data = data
      end

      def to_context
        SnowplowTracker::SelfDescribingJson.new(GITLAB_STANDARD_SCHEMA_URL, to_h)
      end

      def environment
        return 'staging' if Gitlab.staging?

        return 'production' if Gitlab.com?

        return 'org' if Gitlab.org?

        return 'self-managed' if Rails.env.production?

        'development'
      end

      def source
        GITLAB_RAILS_SOURCE
      end

      private

      def to_h
        {
          environment: environment,
          source: source
        }.merge(@data)
      end
    end
  end
end
