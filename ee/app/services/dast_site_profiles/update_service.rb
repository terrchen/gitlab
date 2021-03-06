# frozen_string_literal: true

module DastSiteProfiles
  class UpdateService < BaseService
    def execute(id:, profile_name:, target_url:)
      return ServiceResponse.error(message: 'Insufficient permissions') unless allowed?

      dast_site_profile = find_dast_site_profile!(id)

      return ServiceResponse.error(message: "Cannot modify #{dast_site_profile.name} referenced in security policy") if referenced_in_security_policy?(dast_site_profile)

      ActiveRecord::Base.transaction do
        service = DastSites::FindOrCreateService.new(project, current_user)
        dast_site = service.execute!(url: target_url)

        dast_site_profile.update!(name: profile_name, dast_site: dast_site)

        ServiceResponse.success(payload: dast_site_profile)
      end

    rescue ActiveRecord::RecordNotFound => err
      ServiceResponse.error(message: "#{err.model} not found")
    rescue ActiveRecord::RecordInvalid => err
      ServiceResponse.error(message: err.record.errors.full_messages)
    end

    private

    def allowed?
      Ability.allowed?(current_user, :create_on_demand_dast_scan, project)
    end

    def referenced_in_security_policy?(profile)
      profile.referenced_in_security_policies.present?
    end

    # rubocop: disable CodeReuse/ActiveRecord
    def find_dast_site_profile!(id)
      DastSiteProfilesFinder.new(project_id: project.id, id: id).execute.first!
    end
    # rubocop: enable CodeReuse/ActiveRecord
  end
end
