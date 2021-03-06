# frozen_string_literal: true

module RequirementsManagement
  class ProcessRequirementsReportsWorker
    include ApplicationWorker

    feature_category :requirements_management
    idempotent!
    tags :requires_disk_io

    def perform(build_id)
      ::Ci::Build.find_by_id(build_id).try do |build|
        RequirementsManagement::ProcessTestReportsService.new(build).execute
      end
    end
  end
end
