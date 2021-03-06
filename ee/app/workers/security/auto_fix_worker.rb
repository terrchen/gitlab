# frozen_string_literal: true

module Security
  class AutoFixWorker
    include ApplicationWorker

    feature_category :vulnerability_management

    idempotent!

    # rubocop: disable CodeReuse/ActiveRecord
    def perform(pipeline_id)
      return if Feature.disabled?(:security_auto_fix)

      ::Ci::Pipeline.find_by(id: pipeline_id).try do |pipeline|
        project = pipeline.project

        break unless project.security_setting.auto_fix_enabled?

        Security::AutoFixService.new(project, pipeline).execute
      end
    end
    # rubocop: enable CodeReuse/ActiveRecord
  end
end
