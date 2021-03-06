# frozen_string_literal: true

module Security
  module Orchestration
    class AssignService < ::BaseService
      def execute
        res = create_or_update_security_policy_configuration

        return success if res

      rescue ActiveRecord::RecordNotFound => _
        error('Policy project doesn\'t exists')
      rescue ActiveRecord::RecordInvalid => _
        error('Couldn\'t assign policy to project')
      end

      private

      def create_or_update_security_policy_configuration
        policy_project = Project.find(policy_project_id)

        if has_existing_policy?
          project.security_orchestration_policy_configuration.update!(
            security_policy_management_project_id: policy_project.id
          )
        else
          project.create_security_orchestration_policy_configuration! do |p|
            p.security_policy_management_project_id = policy_project.id
          end
        end
      end

      def success
        ServiceResponse.success(payload: { policy_project: policy_project_id })
      end

      def error(message)
        ServiceResponse.error(payload: { policy_project: policy_project_id }, message: message)
      end

      def has_existing_policy?
        project.security_orchestration_policy_configuration.present?
      end

      def policy_project_id
        params[:policy_project_id]
      end
    end
  end
end
