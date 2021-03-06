# frozen_string_literal: true

module Types
  class BaseArgument < GraphQL::Schema::Argument
    include GitlabStyleDeprecations

    def initialize(*args, **kwargs, &block)
      kwargs = gitlab_deprecation(kwargs)

      super(*args, **kwargs, &block)
    end
  end
end
