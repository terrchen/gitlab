# frozen_string_literal: true

module EE
  SUBSCRIPTIONS_URL = ENV.fetch('CUSTOMER_PORTAL_URL', 'https://customers.gitlab.com').freeze
  SUBSCRIPTIONS_COMPARISON_URL = "https://about.gitlab.com/pricing/gitlab-com/feature-comparison".freeze
  SUBSCRIPTIONS_MORE_MINUTES_URL = "#{SUBSCRIPTIONS_URL}/buy_pipeline_minutes".freeze
  SUBSCRIPTIONS_PLANS_URL = "#{SUBSCRIPTIONS_URL}/plans".freeze
  CUSTOMER_SUPPORT_URL = 'https://support.gitlab.com'.freeze
end
